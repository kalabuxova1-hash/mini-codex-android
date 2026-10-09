"""Read-only source/archive release preflight and adversarial fixture tests."""
from __future__ import annotations
import argparse
import io
import os
from pathlib import Path, PurePosixPath
import re
import stat
import tarfile
import tempfile
import unittest
import zipfile

# Private deployment identifiers are supplied locally, never shipped in source.
PRIVATE_VALUES: tuple[str, ...] = ()
MAX_FILE = 32 * 1024 * 1024
MAX_ARCHIVE = 128 * 1024 * 1024
RUNTIME_DIRS = {"state", "logs", "memory", "archives", "node_modules", ".env", ".git"}
GENERATED_DIRS = {"node_modules", "dist", ".wrangler", ".vinext", ".next", ".sites-runtime", "__pycache__", ".git"}
RUNTIME_NAMES = {"config.json", "config.toml", "config.yaml", "config.yml", "agent.lock", ".env"}
BAD_SUFFIXES = {".log", ".sqlite", ".sqlite3", ".db", ".pyc", ".pyo"}
WINDOWS_USER_PATH = re.compile(r"[a-z]:[\\/]+users[\\/]+[^\s\"'<>]+", re.I)
SITE_ID = re.compile(r"\b(?:templated_apps_|plugin_(?:asdk_app_sites_)?|appgprj_)[0-9a-f]{16,}\b", re.I)
TOKEN_ASSIGNMENT = re.compile(
    r"[\"']?(?:agent_token|sites_authorization|access_token|refresh_token|api_key|client_secret)[\"']?"
    r"\s*[:=]\s*[\"']([^\"'\r\n]{24,})[\"']", re.I
)
BEARER = re.compile(r"\bBearer\s+[A-Za-z0-9_-]{32,}\b")
PROVIDER_KEY = re.compile(r"\b(?:sk-(?:proj-)?|ghp_)[A-Za-z0-9_-]{24,}\b")
PLACEHOLDER = re.compile(r"^(?:REPLACE[_A-Z]*|YOUR[_A-Z]*|EXAMPLE[_A-Z]*|<[^>]+>|\$\{[^}]+\})$")


def path_issues(name: str, archive: bool = False) -> list[str]:
    result = []
    if "\x00" in name or "\\" in name or name.startswith("/") or re.match(r"^[A-Za-z]:", name):
        result.append("unsafe absolute/Windows/NUL path")
    parts = PurePosixPath(name).parts
    if ".." in parts:
        result.append("path traversal")
    lower = tuple(part.lower() for part in parts)
    base = lower[-1] if lower else ""
    if any(part in RUNTIME_DIRS for part in lower):
        result.append("runtime/dependency directory")
    if base in RUNTIME_NAMES or Path(base).suffix in BAD_SUFFIXES or base.endswith(("-wal", "-shm", "-journal")):
        result.append("private runtime/config file")
    if archive and any(part in GENERATED_DIRS for part in lower):
        result.append("generated build/cache content")
    return result


def content_issues(data: bytes, extra_forbidden: tuple[str, ...] = ()) -> list[str]:
    # Decode even binary contents to catch accidentally bundled private files.
    text = data.decode("utf-8", "replace")
    result = []
    for value in PRIVATE_VALUES + extra_forbidden:
        if value and value.casefold() in text.casefold():
            result.append("private deployment identifier")
            break
    if WINDOWS_USER_PATH.search(text):
        result.append("local Windows user path")
    if SITE_ID.search(text):
        result.append("concrete private plugin/Site ID")
    if any(not PLACEHOLDER.fullmatch(match.group(1)) for match in TOKEN_ASSIGNMENT.finditer(text)):
        result.append("literal credential assignment")
    if BEARER.search(text) or PROVIDER_KEY.search(text):
        result.append("literal credential")
    return result


def scan_source(root: Path, extra_forbidden: tuple[str, ...] = ()) -> list[str]:
    issues = []
    if root.is_symlink() or root.is_junction() or not root.is_dir():
        return ["source root must be a real directory"]
    for directory, dirs, files in os.walk(root, followlinks=False):
        # Build caches are ignored source inputs; archived releases reject them.
        for item in list(dirs):
            path = Path(directory) / item
            rel = path.relative_to(root).as_posix()
            if path.is_symlink() or path.is_junction():
                issues.append(rel + ": symlink")
                dirs.remove(item)
            elif item in GENERATED_DIRS:
                dirs.remove(item)
            else:
                issues.extend(rel + ": " + problem for problem in path_issues(rel))
                issues.extend(rel + ": " + problem for problem in content_issues(rel.encode(), extra_forbidden))
        for item in files:
            path = Path(directory) / item
            rel = path.relative_to(root).as_posix()
            info = path.lstat()
            if not stat.S_ISREG(info.st_mode):
                issues.append(rel + ": symlink/special file")
                continue
            issues.extend(rel + ": " + problem for problem in path_issues(rel))
            issues.extend(rel + ": " + problem for problem in content_issues(rel.encode(), extra_forbidden))
            if info.st_size > MAX_FILE:
                issues.append(rel + ": file exceeds inspection limit")
                continue
            issues.extend(rel + ": " + problem for problem in content_issues(path.read_bytes(), extra_forbidden))
    return sorted(set(issues))


def scan_archive(path: Path, extra_forbidden: tuple[str, ...] = ()) -> list[str]:
    issues = []
    total = 0
    names = set()
    def check(name: str, size: int, regular: bool, directory: bool, read):
        nonlocal total
        issues.extend(name + ": " + problem for problem in path_issues(name, archive=True))
        issues.extend(name + ": " + problem for problem in content_issues(name.encode(), extra_forbidden))
        normalized = str(PurePosixPath(name)).casefold()
        if normalized in names:
            issues.append(name + ": duplicate/case-colliding member")
        names.add(normalized)
        if directory:
            return
        if not regular:
            issues.append(name + ": symlink/hardlink/special member")
            return
        total += size
        if size > MAX_FILE or total > MAX_ARCHIVE:
            issues.append(name + ": archive inspection size limit")
            return
        issues.extend(name + ": " + problem for problem in content_issues(read(), extra_forbidden))
    try:
        if zipfile.is_zipfile(path):
            with zipfile.ZipFile(path) as archive:
                for member in archive.infolist():
                    mode = (member.external_attr >> 16) & 0xFFFF
                    kind = stat.S_IFMT(mode)
                    regular = kind in (0, stat.S_IFREG) and not member.flag_bits & 1
                    check(member.filename, member.file_size, regular, member.is_dir(), lambda m=member: archive.read(m))
        else:
            with tarfile.open(path, "r:*") as archive:
                for member in archive:
                    check(member.name, member.size, member.isfile(), member.isdir(), lambda m=member: archive.extractfile(m).read())
    except (OSError, ValueError, tarfile.TarError, zipfile.BadZipFile, RuntimeError) as exc:
        issues.append("unreadable archive: " + type(exc).__name__)
    return sorted(set(issues))


class ReleaseSafetyTests(unittest.TestCase):
    def test_generated_source_is_skipped_but_not_archived(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / ".wrangler").mkdir()
            (root / ".wrangler" / "config.json").write_text("{}")
            self.assertEqual(scan_source(root), [])
            self.assertTrue(path_issues(".wrangler/config.json", archive=True))

    def test_clean_templates_and_hashes(self):
        self.assertEqual(path_issues("agent/config.example.json"), [])
        self.assertEqual(content_issues(('sha256=' + 'a' * 64).encode()), [])
        self.assertEqual(content_issues(b'{"agent_token":"REPLACE_WITH_PRIVATE_RANDOM_VALUE"}'), [])

    def test_runtime_paths(self):
        for path in ("agent/config.json", "state/jobs.sqlite3", "logs/agent.log", "node_modules/a/index.js", "agent/notes.sqlite3-wal"):
            self.assertTrue(path_issues(path), path)

    def test_private_identifiers_and_credentials(self):
        for data in ("C:" + "\\Users\\" + "test-owner\\file", "templated_apps_" + "a" * 32,
                     '{"agent_token":"' + 'a' * 64 + '"}', "Bearer " + 'b' * 40, "sk-" + 'c' * 40):
            self.assertTrue(content_issues(data.encode()), data[:12])
        self.assertTrue(content_issues(b"https://personal-relay.example", ("personal-relay.example",)))
        self.assertTrue(content_issues(b"fixture-device-identity", ("fixture-device-identity",)))

    def test_source_symlink_and_config(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "config.json").write_text("{}")
            self.assertTrue(scan_source(root))
            (root / "config.json").unlink()
            try:
                (root / "link").symlink_to(root / "outside")
            except (OSError, NotImplementedError):
                return  # Windows may lack symlink privileges; tar test is unconditional.
            self.assertTrue(scan_source(root))

    def test_tar_rejects_traversal_links_runtime_and_duplicates(self):
        with tempfile.TemporaryDirectory() as temp:
            archive_path = Path(temp) / "fixture.tar.gz"
            with tarfile.open(archive_path, "w:gz") as archive:
                for name in ("../escape", "/absolute", "agent/config.json", "state/jobs.sqlite3", "node_modules/index.js", "OK.txt", "ok.txt"):
                    member = tarfile.TarInfo(name)
                    member.size = 2
                    archive.addfile(member, io.BytesIO(b"{}"))
                for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE):
                    member = tarfile.TarInfo("link" + kind.decode())
                    member.type, member.linkname = kind, "/private"
                    archive.addfile(member)
            issues = scan_archive(archive_path)
            for marker in ("traversal", "absolute", "private runtime", "dependency", "symlink/hardlink", "duplicate"):
                self.assertTrue(any(marker in issue for issue in issues), marker)

    def test_zip_detects_secret_member_and_symlink(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "fixture.zip"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("readme.txt", "fixture-device-identity")
                member = zipfile.ZipInfo("link")
                member.create_system = 3
                member.external_attr = (stat.S_IFLNK | 0o777) << 16
                archive.writestr(member, "outside")
            issues = scan_archive(path, ("fixture-device-identity",))
            self.assertTrue(any("identifier" in issue for issue in issues))
            self.assertTrue(any("symlink" in issue for issue in issues))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scan", type=Path)
    parser.add_argument("--forbid", action="append", default=[], help="Additional private non-secret ID/hostname to reject")
    args, rest = parser.parse_known_args()
    if args.scan:
        found = scan_source(args.scan, tuple(args.forbid)) if args.scan.is_dir() else scan_archive(args.scan, tuple(args.forbid))
        for issue in found:
            print(issue)
        print("Release scan: " + ("FAILED" if found else "OK"))
        raise SystemExit(bool(found))
    unittest.main(argv=[__file__] + rest)

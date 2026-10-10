"""Build reproducible Magisk-app ZIPs without phone access or credentials."""
import hashlib
from pathlib import Path
import shutil
import zipfile

VERSION='0.2.0'
ROOT=Path(__file__).resolve().parents[1]
MODULE_FILES=('module.prop','skip_mount','customize.sh','service.sh','stop.sh','uninstall.sh','configure.sh','INSTALL_WITH_CODEX.md')
AGENT_FILES=('native_phone.py','phone_agent.py','tool-definitions.json','configure.py','support_runtime.py','support/SKILL.md','support/services.md')


def build(root=ROOT):
    root=Path(root)
    output=root/'dist'
    output.mkdir(exist_ok=True)
    target=output/f'mini-codex-magisk-{VERSION}.zip'
    entries=[(root/'magisk'/name,name) for name in MODULE_FILES]
    entries += [(root/'agent'/name,'agent/'+name) for name in AGENT_FILES]
    entries.append((root/'LICENSE','LICENSE'))
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
        for source,name in sorted(entries,key=lambda item:item[1]):
            if source.is_symlink() or not source.is_file():
                raise ValueError('Release inputs must be regular files')
            data=source.read_bytes().replace(b'\r\n',b'\n')
            info=zipfile.ZipInfo(name,(2026,1,1,0,0,0))
            info.create_system=3
            info.external_attr=(0o100755 if name.endswith('.sh') else 0o100644)<<16
            info.compress_type=zipfile.ZIP_DEFLATED
            archive.writestr(info,data)
    agent_output=output/'agent'
    agent_output.mkdir(exist_ok=True)
    for name in AGENT_FILES:
        (agent_output/name).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root/'agent'/name,agent_output/name)
    digest=hashlib.sha256(target.read_bytes()).hexdigest()
    (output/'SHA256SUMS').write_text(f'{digest}  {target.name}\n',encoding='utf-8')
    return target


if __name__=='__main__':
    print(build())

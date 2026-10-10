"""Explicit phone-to-PC requests through an existing owner-private relay."""
import argparse
import json
from pathlib import Path
from phone_agent import Relay
from configure import BASE, read_config


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('operation', choices=['list', 'call', 'result'])
    parser.add_argument('--connection'); parser.add_argument('--tool'); parser.add_argument('--arguments', default='{}')
    parser.add_argument('--request-id'); parser.add_argument('--job-id')
    args = parser.parse_args()
    if args.operation != 'list' and not args.connection: parser.error('--connection is required')
    if args.operation == 'call' and (not args.tool or not args.request_id): parser.error('--tool and --request-id are required')
    if args.operation == 'result' and not args.job_id: parser.error('--job-id is required')
    body = {'action': 'from_phone', 'operation': args.operation, 'connection_id': args.connection,
            'tool': args.tool, 'arguments': json.loads(args.arguments), 'request_id': args.request_id, 'job_id': args.job_id}
    reply = Relay(read_config(Path(BASE)/'config.json')).request('/bridge/api', body)
    print(json.dumps(reply, ensure_ascii=False))


if __name__ == '__main__': main()

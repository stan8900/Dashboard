#!/usr/bin/env python3
"""Preview or apply explicit Railway service settings through its public API."""

import argparse
import json
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("role", choices=["web", "worker"])
parser.add_argument("--service", required=True, help="Exact Railway service ID")
parser.add_argument("--environment", required=True, help="Exact environment ID")
parser.add_argument("--apply", action="store_true")
args = parser.parse_args()
settings = json.loads(
    Path(__file__).with_name(f"{args.role}-settings.json").read_text()
)
variables = {
    "service": args.service,
    "environment": args.environment,
    "input": settings,
}
if not args.apply:
    print(json.dumps(variables, indent=2))
else:
    query = (
        "mutation Configure($service: String!, $environment: String!, "
        "$input: ServiceInstanceUpdateInput!) { serviceInstanceUpdate("
        "serviceId: $service, environmentId: $environment, input: $input) }"
    )
    subprocess.run(
        ["railway", "api", query, "--variables", json.dumps(variables)],
        check=True,
    )

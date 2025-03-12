#!/bin/bash

# blah blah create stacks for `shared`
pulumi stack init shared

pulumi stack select shared

pulumi up --yes

#!/bin/bash

# Check if the shared stack exists
if ! pulumi stack ls | grep -q "shared"; then
    # Create the stack if it doesn't exist
    pulumi stack init shared
fi

pulumi stack select shared

pulumi preview

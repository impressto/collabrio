#!/usr/bin/env python3
"""
Script to update CSS selectors for CSS isolation.
This adds .collabrio-app prefix to all CSS selectors that don't already have it.
"""

import re
import sys

def update_css_isolation(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Pattern to match CSS selectors that don't already have .collabrio-app
    # This matches lines that start with a dot followed by a class name, not already prefixed
    pattern = r'^(\.(?!collabrio-app)[a-zA-Z-][a-zA-Z0-9-]*(?:\.[a-zA-Z-][a-zA-Z0-9-]*)*(?:::?[a-zA-Z-]+)?)\s*\{'
    
    def replace_selector(match):
        selector = match.group(1)
        return f'.collabrio-app {selector} {{'
    
    # Apply the transformation
    updated_content = re.sub(pattern, replace_selector, content, flags=re.MULTILINE)
    
    # Handle pseudo-selectors and compound selectors
    # Update selectors that have pseudo-classes but aren't prefixed
    pseudo_pattern = r'^(\.(?!collabrio-app)[a-zA-Z-][a-zA-Z0-9-]*:[a-zA-Z-]+)\s*\{'
    updated_content = re.sub(pseudo_pattern, r'.collabrio-app \1 {', updated_content, flags=re.MULTILINE)
    
    # Write back the updated content
    with open(file_path, 'w') as f:
        f.write(updated_content)
    
    print(f"✅ Updated CSS isolation for {file_path}")

if __name__ == "__main__":
    css_file = "/home/impressto/work/impressto/homeserver/www/homelab/collabrio/client/src/App.css"
    update_css_isolation(css_file)
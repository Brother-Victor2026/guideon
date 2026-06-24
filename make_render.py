content = """services:
  - type: web
    name: guideon
    runtime: node
    buildCommand: npm install
    startCommand: node server.mjs
    envVars:
      - key: NODE_ENV
        value: production
"""
with open('render.yaml', 'w') as f:
    f.write(content)
print('OK: render.yaml cree')

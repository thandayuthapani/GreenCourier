import sys

response = sys.stdin.read()

if "denied" not in response:
  sys.stdout.write("ok")
else:
  sys.stderr.write("error")
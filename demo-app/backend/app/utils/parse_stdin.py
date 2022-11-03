import sys

unmodified = sys.stdin.read()
entry_data = unmodified.split(" ", 1)

if entry_data[0] == "error:":
  sys.stdout.write(entry_data[0])
  sys.stderr.write(entry_data[1])
elif entry_data[0] == "ok:":
  sys.stdout.write(entry_data[0])
else:
  sys.stdout.write("failure")
  sys.stderr.write(unmodified)
import logging
import subprocess


def shell(cmd, quiet=False):
    if not quiet:
        logging.debug(f'  shell: {cmd}')
    result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout
    try:
        result = result.decode().strip()
    except:
        pass
    if result and not quiet:
        logging.debug(f'    result: {result}')
    return result
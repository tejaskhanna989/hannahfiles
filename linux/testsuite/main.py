import argparse
import logging
import sys
from pathlib import Path

from core.runner import run_tests
import core.test_constants as tconst


def configure_logging(debug : bool = False) -> None:
    # Prefer stdout instead of default stderr
    handler = logging.StreamHandler(sys.stdout)
    
    # 7s to align all log levelnames - WARNING is the largest level, with size 7
    handler.setFormatter(logging.Formatter(
        '[%(asctime)s - %(levelname)7s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))


    logger = logging.getLogger()
    logger.addHandler(handler)

    if debug:
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(logging.INFO)

    logging.getLogger("libtmux").setLevel(logging.WARNING)

def main():
    # Setup argument parser
    parser = argparse.ArgumentParser(description='hannahfiles testsuite')
    parser.add_argument('-d', '--debug',action='store_true',
                        help='Enable debug logging')
    parser.add_argument('--close-wait-time', type=float,
                        help='Override default wait time after closing hf')
    parser.add_argument('--hf-path', type=str,
                        help='Override the default hf executable path(../bin/hannahfiles) under test')
    parser.add_argument('-t', '--tests', nargs='+',
                        help='Specify one or more than one space separated testcases to be run')
    # Parse arguments
    args = parser.parse_args()
    if args.close_wait_time is not None:
        tconst.CLOSE_WAIT_TIME = args.close_wait_time
    
    configure_logging(args.debug)
        
    # Default path
    # We maybe should run this only in main.py file.
    hf_path = Path(__file__).parent.parent / "bin" / "hannahfiles"

    if args.hf_path is not None:
        hf_path = Path(args.hf_path)
    # Resolve any symlinks, and make it absolute
    hf_path = hf_path.resolve()

    success = run_tests(hf_path, only_run_tests=args.tests)
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

main()

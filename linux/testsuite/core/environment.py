from core.hf_manager import BaseHFManager
from core.fs_manager import TestFSManager

class Environment:
    """Manage test environment
    Manage cleanup of environment and other stuff at a single place
    """    
    def __init__(self, hf_manager : BaseHFManager, fs_manager : TestFSManager ):
        self.hf_mgr = hf_manager
        self.fs_mgr = fs_manager

    def cleanup(self) -> None:
        self.hf_mgr.close_hf()
        self.fs_mgr.cleanup()
import time 
import subprocess
import pyautogui
import core.keys as keys
from core.hf_manager import BaseHFManager

class PyAutoGuiHFManager(BaseHFManager):
    """Manage HF via subprocesses and pyautogui
    Cross platform, but it globally takes over the input, so you need the terminal 
    constantly on focus during test run
    """
    HF_START_DELAY : float = 0.5
    def __init__(self, hf_path : str):
        super().__init__(hf_path)
        self.hf_process = None


    def start_hf(self, start_dir : str = None, args : list[str] = None) -> None:
        hf_args = [self.hf_path]
        if args :
            hf_args += args
        hf_args.append(start_dir)

        self.hf_process = subprocess.Popen(hf_args,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(PyAutoGuiHFManager.HF_START_DELAY)

        # Need to send a sample keypress otherwise it ignores first keypress
        self.send_text_input('x')
        
    
    def send_text_input(self, text : str, all_at_once : bool = False) -> None:
        if all_at_once :
            pyautogui.write(text)
        else:
            for c in text:
                pyautogui.write(c)

    def send_special_input(self, key : keys.Keys) -> None:
        if isinstance(key, keys.CtrlKeys):
            pyautogui.hotkey('ctrl', key.char)
        elif isinstance(key, keys.SpecialKeys):
            pyautogui.press(key.key_name.lower())
        else:
            raise Exception(f"Unknown key : {key}") 

    def get_rendered_output(self) -> str:
        return "[Not supported yet]" 
    
    
    def is_hf_running(self) -> bool:
        self._is_hf_running = (self.hf_process is not None) and (self.hf_process.poll() is None)
        return self._is_hf_running
    
    def close_hf(self) -> None:
        if self.hf_process is not None:
            self.hf_process.terminate()
    
    # Override
    def runtime_info(self) -> str:
        if self.hf_process is None:
            return "[No process]"
        else:
            return f"[PID : {self.hf_process.pid}, poll : {self.hf_process.poll()}]"  




import dataclasses
import queue
import threading
from typing import Optional


class ThreadManager:
    """
    execute threads of 1 namespace synchronously, but parallel in a global scope
    """

    @dataclasses.dataclass
    class Namespace:
        locked: bool = False
        thread_queue: Optional[queue.Queue] = None

    def __init__(self):
        self._message_queue = {}

    def _execute(self, namespace_name: str):
        namespace = self._message_queue.get(namespace_name, ThreadManager.Namespace())
        if not namespace.thread_queue:
            return
        if namespace.locked:
            return
        try:
            thread = namespace.thread_queue.get(block=False)
        except queue.Empty:
            return

        namespace.locked = True
        thread.start()
        thread.join()
        namespace.thread_queue.task_done()
        namespace.locked = False

        return self._execute(namespace_name)

    def add_thread(self, namespace_name: str, thread: threading.Thread):
        namespace = self._message_queue.get(namespace_name, ThreadManager.Namespace())
        if not namespace.thread_queue:
            namespace.thread_queue = queue.Queue()

        namespace.thread_queue.put(thread)
        self._message_queue[namespace_name] = namespace

        t = threading.Thread(target=self._execute, args=(namespace_name,))
        t.start()

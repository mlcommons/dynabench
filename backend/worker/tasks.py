from worker.config import app
import time

@app.task(name="add", queue = "test")
def add(x, y):
    return x + y

@app.task(name="generate_nibbler_images_celery", queue = "test")
def generate_nibbler_images_celery(prompt: str, num_images: int, model: dict, endpoint: dict, user_id: int):
    start = time.perf_counter()
    from app.domain.services.utils.multi_generator import ImageGenerator
    image = ImageGenerator().generate_one_image(prompt, num_images, model, endpoint, user_id)
    image["queue_task_id"] = app.current_task.request.id
    image["time"] = time.perf_counter() - start
    image["user_id"] = user_id
    return image

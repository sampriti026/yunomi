from datetime import datetime
from dependencies import db

def get_post(post_id: str):
    try:
        post_data = db.collection('posts').document(post_id).get()
        if post_data.exists:
            return {"status": "success", "data": post_data.to_dict()}
        else:
            return {"status": "failure", "message": "Post not found"}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"status": "failure", "message": "An error occurred while fetching the post"}


def like_post(post_id: str, user_id: str):
    try:
        post_ref = db.collection('posts').document(post_id)
        post_data = post_ref.get()

        if post_data.exists:
            likers = post_data.get("likers") or []
            if user_id not in likers:
                likers.append(user_id)
                post_ref.update({"likers": likers, "likes_count": len(likers)})
            return {"status": "success", "message": "Post liked successfully"}
        else:
            return {"status": "failure", "message": "Post not found"}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"status": "failure", "message": "An error occurred while liking the post"}

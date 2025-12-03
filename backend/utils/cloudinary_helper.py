import cloudinary
import cloudinary.uploader
import cloudinary.api
import os

def configure_cloudinary():
    cloudinary.config(
        cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
        api_key=os.getenv('CLOUDINARY_API_KEY'),
        api_secret=os.getenv('CLOUDINARY_API_SECRET'),
        secure=True
    )

def upload_to_cloudinary(file, folder="viego_blog", **kwargs):
    """
    Uploads a file to Cloudinary and returns the secure URL.
    
    Args:
        file: The file object to upload (from request.files).
        folder: The folder in Cloudinary to store the image.
        **kwargs: Additional arguments to pass to cloudinary.uploader.upload
        
    Returns:
        str: The secure URL of the uploaded image, or None if upload fails.
    """
    try:
        configure_cloudinary()
        # Cloudinary handles the file stream directly
        upload_result = cloudinary.uploader.upload(file, folder=folder, **kwargs)
        return upload_result.get("secure_url")
    except Exception as e:
        print(f"Cloudinary upload error: {str(e)}")
        return None

def delete_from_cloudinary(public_id):
    """
    Deletes a file from Cloudinary.
    
    Args:
        public_id: The public ID of the image to delete.
    """
    try:
        configure_cloudinary()
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception as e:
        print(f"Cloudinary delete error: {str(e)}")
        return False

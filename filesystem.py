import os

def read_file(file_path):
    """Reads the contents of a file."""
    with open(file_path, 'r') as file:
        return file.read()

def write_file(file_path, data):
    """Writes data to a file."""
    with open(file_path, 'w') as file:
        file.write(data)

def append_to_file(file_path, data):
    """Appends data to the end of a file."""
    with open(file_path, 'a') as file:
        file.write(data)

def list_directory(directory):
    """Lists the contents of a directory."""
    return os.listdir(directory)

def create_directory(directory):
    """Creates a new directory."""
    os.makedirs(directory, exist_ok=True)

def file_exists(file_path):
    """Checks if a file exists."""
    return os.path.isfile(file_path)

def directory_exists(directory):
    """Checks if a directory exists."""
    return os.path.isdir(directory)

def delete_file(file_path):
    """Deletes a file."""
    os.remove(file_path)

def delete_directory(directory):
    """Deletes a directory."""
    os.rmdir(directory)

def rename_file(old_file_path, new_file_path):
    """Renames a file."""
    os.rename(old_file_path, new_file_path)

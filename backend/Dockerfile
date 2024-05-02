# Use an official Python runtime as a base image
FROM python:3.9

# Set the working directory in the container
WORKDIR /app

COPY ./requirements.txt /app/requirements.txt


# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . /app

# Make port 80 available to the world outside this container
EXPOSE 80

# Define environment variable
ENV CLUSTER_ENDPOINT=https://in03-c2901c7a5de96d7.api.gcp-us-west1.zillizcloud.com TOKEN=e5b5c45dbae3db12d4efed2f2eeaa77600e58a3be5fceaa6376a3e07f620524b2fdd72ecb044788a22c6238f403cedbd07069955 OPENAI_API_KEY=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 encryption_key=ftNm7SeeApUK0MUP2J4M83XlntR8tTgqE9TWP0IMenw=

# Run app.py when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]

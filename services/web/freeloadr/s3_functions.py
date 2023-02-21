import boto3
import os

def upload_file(file_name, bucket, object_name):

    s3_client = boto3.client('s3')
    response = s3_client.upload_file(file_name, bucket, object_name)
    return response

def delete_object(bucket, listing_id, object_name):
    s3_client = boto3.client('s3')
    response = s3_client.delete_object(Bucket=bucket, Key=f'{listing_id}/{object_name}')

    return response

def get_presigned_urls(bucket, listing_id):

    prefix = f'{str(listing_id)}/'

    s3_client = boto3.client('s3')
    public_urls = []
    try:
        items =  s3_client.list_objects(Bucket=bucket, Prefix=prefix)['Contents']
        items = sorted(items, key=lambda item: item['LastModified'])
        for item in items:
            presigned_url = s3_client.generate_presigned_url('get_object', Params = {'Bucket': bucket, 'Key': item['Key']}, ExpiresIn=3600)
            public_urls.append(presigned_url)
    except Exception as e:
        pass

    return public_urls
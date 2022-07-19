import boto3
class Downloader:
    def __init__(self):
        self.client = boto3.client('s3')
    
    def s3_downloader(self, bucket: str, file: str, output_name: str):
        """
        Downloads an S3 file given a bucket and a file. AWS credentials must
        have been configured into the .aws/credentials file.
        """
        
        for i in self._list_s3_buckets()['Buckets']:
            if i['Name'] == bucket:
                self.client.download_file(bucket, file, output_name)
            else:
                continue
    
    def _list_s3_buckets(self):
        """
        List all buckets for a given AWS account. Helper function to guarantee the downloader runs.
        """
        return self.client.list_buckets()
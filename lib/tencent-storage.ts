import COS from 'cos-nodejs-sdk-v5';

class TencentCloudStorage {
  private cos: COS | null = null;
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = process.env.TENCENT_COS_BUCKET || '';
    this.region = process.env.TENCENT_COS_REGION || '';
  }

  private initializeStorage() {
    if (this.cos) {
      return this.cos;
    }

    // 从环境变量获取配置
    const secretId = process.env.TENCENT_SECRET_ID;
    const secretKey = process.env.TENCENT_SECRET_KEY;

    if (!secretId || !secretKey || !this.bucketName || !this.region) {
      throw new Error('Missing Tencent Cloud COS configuration');
    }

    console.log('腾讯云COS配置:', {
      secretId: secretId.substring(0, 8) + '***',
      hasSecretKey: !!secretKey,
      bucketName: this.bucketName,
      region: this.region
    });

    // 初始化腾讯云COS客户端
    this.cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey
    });

    return this.cos;
  }

  /**
   * 上传文件到腾讯云COS
   * @param fileName 文件名
   * @param fileBuffer 文件内容
   * @param contentType 文件类型
   * @returns 公共访问URL
   */
  async uploadFile(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    try {
      console.log(`开始上传文件到腾讯云COS: ${fileName}`);
      
      const cos = this.initializeStorage();

      console.log(`存储桶: ${this.bucketName}, 文件: ${fileName}, 大小: ${fileBuffer.length} bytes`);

      // 上传文件到腾讯云COS
      const uploadResult = await new Promise<COS.PutObjectResult>((resolve, reject) => {
        cos.putObject({
          Bucket: this.bucketName,
          Region: this.region,
          Key: fileName,
          Body: fileBuffer,
          ContentType: contentType,
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });

      console.log(`文件上传成功: ${fileName}`, uploadResult);

      // 构建公共访问URL
      const publicUrl = `https://${this.bucketName}.cos.${this.region}.myqcloud.com/${fileName}`;
      console.log(`公共URL: ${publicUrl}`);
      
      return publicUrl;
    } catch (error) {
      console.error('上传文件到腾讯云COS时出错:', {
        fileName,
        bucketName: this.bucketName,
        region: this.region,
        errorType: typeof error,
        errorConstructor: error ? error.constructor.name : 'null',
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
        errorStack: error instanceof Error ? error.stack : undefined
      });
      
      // 提供更详细的错误信息
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
        if (error.message.includes('NoSuchBucket')) {
          throw new Error(`Storage bucket '${this.bucketName}' does not exist`);
        }
        if (error.message.includes('AccessDenied') || error.message.includes('403')) {
          throw new Error('Access denied - check secret key permissions');
        }
        if (error.message.includes('InvalidAccessKeyId') || error.message.includes('401')) {
          throw new Error('Invalid secret credentials');
        }
        if (error.message.includes('404')) {
          throw new Error(`Storage bucket '${this.bucketName}' not found`);
        }
        throw new Error(`Upload failed: ${error.message}`);
      } else {
        console.error('Non-Error object thrown:', error);
        throw new Error(`Upload failed: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * 删除文件
   * @param fileName 文件名
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const cos = this.initializeStorage();
      
      await new Promise<void>((resolve, reject) => {
        cos.deleteObject({
          Bucket: this.bucketName,
          Region: this.region,
          Key: fileName
        }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      console.log(`文件删除成功: ${fileName}`);
    } catch (error) {
      console.error('Error deleting file from Tencent COS:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 检查文件是否存在
   * @param fileName 文件名
   * @returns 是否存在
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const cos = this.initializeStorage();
      
      await new Promise<COS.HeadObjectResult>((resolve, reject) => {
        cos.headObject({
          Bucket: this.bucketName,
          Region: this.region,
          Key: fileName
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  /**
   * 生成临时访问URL（私有存储桶使用）
   * @param fileName 文件名
   * @param expires 过期时间（秒），默认1小时
   * @returns 临时访问URL
   */
  async getSignedUrl(fileName: string, expires: number = 3600): Promise<string> {
    try {
      const cos = this.initializeStorage();
      
      const url = cos.getObjectUrl({
        Bucket: this.bucketName,
        Region: this.region,
        Key: fileName,
        Sign: true,
        Expires: expires
      });
      
      console.log(`生成临时URL: ${fileName}, 有效期: ${expires}秒`);
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// 导出单例实例
export const tencentStorage = new TencentCloudStorage();
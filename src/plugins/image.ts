import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import sharp from 'sharp';
import { PluginContext, Plugin } from '../types';
import { WeChatApi } from '../utils/wechat-api';
import { FileError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * 图片处理插件
 */
export const imagePlugin: Plugin = async (content: string, context: PluginContext): Promise<string> => {
  // 创建 WeChatApi 实例
  const api = new WeChatApi(context.config);
  
  if (context.config.debug) {
    console.log('图片插件开始处理，内容长度:', content.length);
  }
  
  // 查找所有本地图片引用
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let processedContent = content;
  const matches = Array.from(content.matchAll(imageRegex));
  
  if (context.config.debug) {
    console.log('找到图片引用数量:', matches.length);
    matches.forEach((match, index) => {
      console.log(`图片 ${index + 1}: ${match[0]}`);
    });
  }
  
  for (const match of matches) {
     const [fullMatch, altText, imagePath] = match;
     
     // 检查是否是本地文件（不是 http/https URL）
     if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
       // 构建完整的图片路径
       const fullImagePath = path.isAbsolute(imagePath) 
         ? imagePath 
         : path.resolve(path.dirname(context.filePath), imagePath);
       
       try {
         // 检查文件是否存在
         if (!fs.existsSync(fullImagePath)) {
           logger.warn(`图片文件不存在: ${fullImagePath}`);
           continue;
         }
         
         logger.info(`处理图片: ${fullImagePath}`);
         
         // 处理图片以符合微信图文消息图片接口要求
         const processedImagePath = await processImageForArticle(fullImagePath, context);
         
         try {
           // 使用图文消息图片上传接口获取URL
           const uploadResult = await api.uploadImageForArticle(processedImagePath);
           
           // 替换为微信返回的图片URL
           processedContent = processedContent.replace(
             fullMatch,
             `![${altText}](${uploadResult.url})`
           );
           logger.success(`图片上传成功: ${uploadResult.url}`);
         } finally {
           // 清理临时处理的图片文件（如果不是原文件）
           if (processedImagePath !== fullImagePath && fs.existsSync(processedImagePath)) {
             try {
               fs.unlinkSync(processedImagePath);
               if (context.config.debug) {
                 console.log(`已清理临时图片文件: ${processedImagePath}`);
               }
             } catch (cleanupError) {
               if (context.config.debug) {
                 console.warn(`清理临时图片文件失败: ${cleanupError}`);
               }
             }
           }
         }
       } catch (error) {
         logger.error(`处理图片失败: ${fullImagePath}`, error as Error);
         // 图片处理失败时，移除图片引用以避免微信API错误
         processedContent = processedContent.replace(
           fullMatch,
           `[图片处理失败: ${altText}]`
         );
         logger.warn(`已移除失败的图片引用: ${imagePath}`);
       }
     }
   }
  
  return processedContent;
};

/**
 * 处理图文消息内的图片，确保符合微信要求
 * 微信图文消息图片要求：
 * - 格式：仅支持 JPG/PNG
 * - 大小：必须在 1MB 以下
 * - 不占用素材库限制
 */
async function processImageForArticle(imagePath: string, context: PluginContext): Promise<string> {
  const ext = path.extname(imagePath).toLowerCase();
  
  // 如果已经是jpg/png格式且文件大小符合要求，直接返回原文件
  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    const stats = fs.statSync(imagePath);
    if (stats.size <= 1024 * 1024) { // 1MB以下
      return imagePath;
    }
  }
  
  const tempDir = os.tmpdir();
  const fileName = path.basename(imagePath, path.extname(imagePath));
  const processedPath = path.join(tempDir, `${fileName}_article.jpg`);
  
  try {
    let sharpInstance;
    
    if (ext === '.svg') {
      // 对于SVG文件，需要指定密度以确保清晰度
      sharpInstance = sharp(imagePath, { density: 300 });
    } else {
      sharpInstance = sharp(imagePath);
    }
    
    // 获取原始图片信息
    const metadata = await sharpInstance.metadata();
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;
    
    // 计算合适的尺寸，保持宽高比，确保文件大小在1MB以下
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;
    let quality = 85;
    
    // 如果图片过大，按比例缩小
    const maxDimension = 1920; // 最大尺寸
    if (originalWidth > maxDimension || originalHeight > maxDimension) {
      const ratio = Math.min(maxDimension / originalWidth, maxDimension / originalHeight);
      targetWidth = Math.round(originalWidth * ratio);
      targetHeight = Math.round(originalHeight * ratio);
    }
    
    // 处理图片
    await sharpInstance
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: quality,
        progressive: true
      })
      .toFile(processedPath);
    
    // 检查处理后的文件大小，如果仍然过大，降低质量重新处理
    let stats = fs.statSync(processedPath);
    while (stats.size > 1024 * 1024 && quality > 30) {
      quality -= 10;
      await sharp(imagePath)
        .resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: quality,
          progressive: true
        })
        .toFile(processedPath);
      stats = fs.statSync(processedPath);
    }
    
    const fileSizeKB = Math.round(stats.size / 1024);
    
    if (context.config.debug) {
      console.log(`图文消息图片处理完成: ${processedPath} (${fileSizeKB}KB, 质量: ${quality})`);
    }
    
    if (stats.size > 1024 * 1024) {
      throw new FileError(`处理后的图片仍然过大: ${fileSizeKB}KB，超过1MB限制`);
    }
    
    return processedPath;
  } catch (error) {
    throw new FileError(`图文消息图片处理失败: ${error instanceof Error ? error.message : String(error)}`, error as Error);
  }
}

/**
 * 处理封面图片，确保符合微信要求
 * 微信缩略图要求：
 * - 尺寸：建议 300x300 像素
 * - 格式：JPG/PNG
 * - 大小：小于 1MB
 */
async function processCoverImage(imagePath: string, context: PluginContext): Promise<string> {
  const tempDir = os.tmpdir();
  const fileName = path.basename(imagePath, path.extname(imagePath));
  const processedPath = path.join(tempDir, `${fileName}_thumb.jpg`);
  
  try {
    const ext = path.extname(imagePath).toLowerCase();
    let sharpInstance;
    
    if (ext === '.svg') {
      // 对于SVG文件，需要指定密度以确保清晰度
      sharpInstance = sharp(imagePath, { density: 300 });
    } else {
      sharpInstance = sharp(imagePath);
    }
    
    // 使用 sharp 处理图片
    await sharpInstance
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(processedPath);
    
    // 检查处理后的文件大小
    const stats = fs.statSync(processedPath);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    if (context.config.debug) {
      console.log(`图片处理完成: ${processedPath} (${fileSizeKB}KB)`);
    }
    
    return processedPath;
  } catch (error) {
    throw new FileError(`图片处理失败: ${error instanceof Error ? error.message : String(error)}`, error as Error);
  }
}

/**
 * 上传封面图片
 */
export async function uploadCoverImage(imagePath: string, context: PluginContext): Promise<string> {
  let processedImagePath: string | null = null;
  
  try {
    if (!fs.existsSync(imagePath)) {
      throw new FileError(`封面图片不存在: ${imagePath}`);
    }
    
    // 检查原始文件信息
    const stats = fs.statSync(imagePath);
    const fileSize = (stats.size / 1024 / 1024).toFixed(2);
    const ext = path.extname(imagePath).toLowerCase();
    
    logger.info(`准备上传封面图片: ${imagePath} (${fileSize}MB, ${ext})`);
    
    if (context.config.debug) {
      console.log('原始封面图片信息:', {
        path: imagePath,
        size: `${fileSize}MB`,
        extension: ext,
        exists: fs.existsSync(imagePath)
      });
    }
    
    // 处理图片以符合微信要求
    logger.info('正在处理封面图片以符合微信要求...');
    processedImagePath = await processCoverImage(imagePath, context);
    
    const api = new WeChatApi(context.config);
    
    try {
      // 使用永久素材接口上传缩略图
      // 根据微信官方文档，草稿接口的 thumb_media_id 必须是永久素材的 media_id
      const uploadResult = await api.uploadPermanentMedia(processedImagePath, 'thumb');
      logger.success(`封面图片上传成功: ${uploadResult.mediaId}`);
      return uploadResult.mediaId;
    } catch (apiError) {
      if (context.config.debug) {
        console.error('微信API错误详情:', apiError);
      }
      throw apiError;
    }
  } catch (error) {
    if (context.config.debug) {
      console.error('封面图片上传失败详情:', error);
    }
    throw new FileError(`上传封面图片失败: ${error instanceof Error ? error.message : String(error)}`, error as Error);
  } finally {
    // 清理临时文件
    if (processedImagePath && fs.existsSync(processedImagePath)) {
      try {
        fs.unlinkSync(processedImagePath);
        if (context.config.debug) {
          console.log(`已清理临时文件: ${processedImagePath}`);
        }
      } catch (cleanupError) {
        if (context.config.debug) {
          console.warn(`清理临时文件失败: ${cleanupError}`);
        }
      }
    }
  }
}
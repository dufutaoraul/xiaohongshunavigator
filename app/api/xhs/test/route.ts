import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// 执行Python函数的通用方法
async function executePythonFunction(functionName: string, args: any[] = []) {
  return new Promise((resolve, reject) => {
    const argsStr = args.length > 0 ? args.map(arg => JSON.stringify(arg)).join(', ') : '';
    
    const pythonProcess = spawn('python', ['-c', `
import sys
import os
sys.path.append('${path.join(process.cwd(), 'services', 'xhs_bridge').replace(/\\/g, '\\\\')}')
from main import ${functionName}
import json
result = ${functionName}(${argsStr})
print(json.dumps(result, ensure_ascii=False, indent=None, separators=(',', ':')))
`], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const jsonResult = JSON.parse(output.trim());
          resolve(jsonResult);
        } catch (parseError) {
          reject(new Error(`JSON解析错误: ${parseError.message}`));
        }
      } else {
        reject(new Error(`Python脚本执行失败: ${error}`));
      }
    });
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'search':
        const keyword = searchParams.get('keyword');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const cookies = searchParams.get('cookies');
        const sortBy = searchParams.get('sortBy') || 'general';
        
        if (!keyword) {
          return NextResponse.json(
            { error: '缺少搜索关键词参数' },
            { status: 400 }
          );
        }
        
        const searchArgs = cookies ? 
          [keyword, page, pageSize, cookies, sortBy] : 
          [keyword, page, pageSize, sortBy];
        const searchResult = await executePythonFunction('search_notes_by_keyword', searchArgs);
        return NextResponse.json(searchResult);
        
      case 'note':
        const noteId = searchParams.get('noteId');
        
        if (!noteId) {
          return NextResponse.json(
            { error: '缺少笔记ID参数' },
            { status: 400 }
          );
        }
        
        const noteResult = await executePythonFunction('get_note_info', [noteId]);
        return NextResponse.json(noteResult);
        
      default:
        // 默认执行测试函数
        const result = await executePythonFunction('test');
        return NextResponse.json(result);
    }
  } catch (error) {
    console.error('XHS API错误:', error);
    return NextResponse.json(
      { error: '小红书爬虫API执行失败', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    switch (action) {
      case 'search':
        const { keyword, page = 1, pageSize = 10, cookies, sortBy = 'general' } = params;
        
        if (!keyword) {
          return NextResponse.json(
            { error: '缺少搜索关键词参数' },
            { status: 400 }
          );
        }
        
        const searchArgs = cookies ? 
          [keyword, page, pageSize, cookies, sortBy] : 
          [keyword, page, pageSize, sortBy];
        const searchResult = await executePythonFunction('search_notes_by_keyword', searchArgs);
        return NextResponse.json(searchResult);
        
      case 'note':
        const { noteId, cookies: noteCookies } = params;
        
        if (!noteId) {
          return NextResponse.json(
            { error: '缺少笔记ID参数' },
            { status: 400 }
          );
        }
        
        const noteResult = await executePythonFunction('get_note_info', [noteId, noteCookies || '']);
        return NextResponse.json(noteResult);
        
      case 'test':
        const { cookies: testCookies } = params;
        
        if (testCookies) {
          // Cookie有效性测试
          try {
            const testResult = await executePythonFunction('search_notes_by_keyword', [
              '测试',
              1,
              1,
              testCookies,
              'general'
            ]);
            
            if (testResult.error && testResult.status === 'verification_required') {
              return NextResponse.json({
                status: 'verification_required',
                message: 'Cookie有效但触发了验证机制',
                suggestion: '请等待一段时间后重试'
              });
            } else if (testResult.error) {
              return NextResponse.json({
                status: 'invalid',
                message: 'Cookie可能无效或已过期',
                error: testResult.error
              });
            } else {
              return NextResponse.json({
                status: 'ready',
                message: 'Cookie有效，可以正常使用'
              });
            }
          } catch (error) {
            return NextResponse.json({
              status: 'error',
              message: 'Cookie测试失败',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        } else {
          // 默认测试
          const result = await executePythonFunction('test');
          return NextResponse.json(result);
        }
        
      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('XHS POST API错误:', error);
    return NextResponse.json(
      { error: '小红书爬虫API执行失败', details: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// 执行Python函数的通用方法
async function executePythonFunction(functionName: string, args: any[] = []) {
  return new Promise((resolve, reject) => {
    const argsStr = args.length > 0 ? args.map(arg => JSON.stringify(arg)).join(', ') : '';
    
    const pythonProcess = spawn('python', ['-c', `
import sys
sys.path.append('${path.join(process.cwd(), 'services', 'xhs_bridge').replace(/\\/g, '\\\\')}')
from main import ${functionName}
import json
result = ${functionName}(${argsStr})
print(json.dumps(result, ensure_ascii=False))
`]);

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
        
        if (!keyword) {
          return NextResponse.json(
            { error: '缺少搜索关键词参数' },
            { status: 400 }
          );
        }
        
        const searchResult = await executePythonFunction('search_notes_by_keyword', [keyword, page, pageSize]);
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
        const { keyword, page = 1, pageSize = 10 } = params;
        
        if (!keyword) {
          return NextResponse.json(
            { error: '缺少搜索关键词参数' },
            { status: 400 }
          );
        }
        
        const searchResult = await executePythonFunction('search_notes_by_keyword', [keyword, page, pageSize]);
        return NextResponse.json(searchResult);
        
      case 'note':
        const { noteId } = params;
        
        if (!noteId) {
          return NextResponse.json(
            { error: '缺少笔记ID参数' },
            { status: 400 }
          );
        }
        
        const noteResult = await executePythonFunction('get_note_info', [noteId]);
        return NextResponse.json(noteResult);
        
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

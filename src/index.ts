import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';


export function parseDirectories(opts: ParseFilesOptions) {
  if (!opts.include) {
    throw new Error(`invalid include directories`);
  }
  if (typeof opts.include === 'string') {
    opts.include = [opts.include];
  }
  if (!Array.isArray(opts.include)) {
    throw new Error(`invalid include directories`);
  }

  if (!path.isAbsolute(opts.outDir)) {
    opts.outDir = path.join(process.cwd(), opts.outDir);
  }

  try {
    fs.accessSync(opts.outDir);
  } catch (e) {
    fs.mkdirSync(opts.outDir);
  }

  return Promise.all(opts.include.map(inputDir => {
    return walkDir(inputDir, opts);
  })) ;
}


function walkDir(dir: string, opts: ParseFilesOptions) {
  if (!path.isAbsolute(dir)) {
    dir = path.join(process.cwd(), dir);
  }

  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, dirItems) => {
      if (err) {
        reject(err);
        return;
      }

      const promises: Promise<any>[] = [];

      dirItems.forEach(dirItem => {
        const readPath = path.join(dir, dirItem);

        promises.push(new Promise((resolve, reject) => {
          fs.lstat(readPath, (err, stats) => {
            if (err) {
              reject(err);
              return;
            }

            if (stats.isDirectory()) {
              walkDir(readPath, opts).then(resolve).catch(reject);

            } else {
              if (typeof opts.filter === 'function' && !opts.filter(readPath)) {
                resolve();
                return;
              }

              fs.readFile(readPath, 'utf-8', (err, fileContent) => {
                if (err) {
                  reject(err);
                  return;
                }

                try {
                  let fileName = path.basename(readPath);
                  let contentKey = fileName;

                  if (typeof opts.fileName === 'function') {
                    fileName = opts.fileName(fileName);
                  }

                  if (typeof opts.key === 'function') {
                    contentKey = opts.key(contentKey);
                  }

                  parse({
                    contentKey: contentKey,
                    contentText: fileContent,
                    intro: opts.intro,
                    outro: opts.outro
                  }).then(jsonpContent => {
                    const outFile = path.join(opts.outDir, fileName);
                    fs.writeFile(outFile, jsonpContent, { encoding: 'utf-8'}, (err) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve();
                      }
                    });
                  }).catch(reject);

                } catch (e) {
                  reject(e);
                }
              });
            }
          });
        }));
      });

      return Promise.all(promises);
    });
  });
}


export function parse(opts: ParseOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    opts.intro = opts.intro || INTRO;
    opts.outro = opts.outro || OUTRO;

    if (!opts.contentText) {
      resolve(generateJsonStr({}, opts.contentKey, opts));
      return;
    }

    xml2js.parseString(opts.contentText, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(generateJsonStr(result, opts.contentKey, opts));
      }
    });
  });
}


function generateJsonStr(contentJsonData: any, contentKey: string, opts: ParseOptions) {
  const jsonStr = JSON.stringify(contentJsonData)

  const output: string[] = [opts.intro, jsonStr];

  if (typeof contentKey === 'string') {
    output.push(`,"${contentKey}"`);
  }

  output.push(opts.outro);

  return output.join('');
}


export interface ParseOptions {
  contentKey: string;
  contentText: string;
  intro?: string;
  outro?: string;
}


export interface ParseFilesOptions {
  include: string|string[];
  outDir: string;
  intro?: string;
  outro?: string;
  filter?: (path: string) => boolean;
  fileName?: (path: string) => string;
  key?: (path: string) => string;
}


interface FileData {
  path: string;
  content: string;
}


const INTRO = `loadJpml(`;
const OUTRO = `);`;

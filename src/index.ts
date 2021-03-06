import * as fs from 'fs';
import * as path from 'path';


export function generate(opts: GenerateOptions) {
  if (!opts.include) {
    throw new Error(`invalid include directories`);
  }
  if (typeof opts.include === 'string') {
    opts.include = [opts.include];
  }
  if (!Array.isArray(opts.include)) {
    throw new Error(`invalid include directories`);
  }

  if (typeof opts.outDir === 'string') {
    opts.outDir = [opts.outDir];
  }
  if (!Array.isArray(opts.outDir)) {
    throw new Error(`invalid outDir directories`);
  }

  opts.outDir = (opts.outDir as string[]).map(outDir => {
    if (!path.isAbsolute(outDir)) {
      return path.join(process.cwd(), outDir);
    }
    return outDir;
  });

  (opts.outDir as string[]).forEach(outDir => {
    try {
      fs.accessSync(outDir);
    } catch (e) {
      fs.mkdirSync(outDir);
    }
  });

  return Promise.all(opts.include.map(inputDir => {
    return walkDir(inputDir, opts);
  })) ;
}


function walkDir(dir: string, opts: GenerateOptions) {
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

                  const jsonpContent = genereateJsonp({
                    contentKey: contentKey,
                    contentText: fileContent,
                    wrapper: opts.wrapper
                  });

                  Promise.all([(opts.outDir as string[]).map(outDir => {
                    return new Promise((resolve, reject) => {
                      const outFile = path.join(outDir, fileName);
                      fs.writeFile(outFile, jsonpContent, { encoding: 'utf-8'}, (err) => {
                        if (err) {
                          reject(err);
                        } else {
                          resolve();
                        }
                      });
                    });
                  })]).then(resolve).catch(reject);

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


export function genereateJsonp(opts: GenereateJsonpOptions) {
  opts.wrapper = opts.wrapper || defaultWrapper;
  return opts.wrapper(opts.contentText, opts.contentKey);
}


export interface GenereateJsonpOptions {
  contentKey: string;
  contentText: string;
  wrapper?: (contextText: string, contentKey?: string) => string;
}


export interface GenerateOptions {
  include: string|string[];
  outDir: string|string[];
  filter?: (path: string) => boolean;
  fileName?: (path: string) => string;
  key?: (path: string) => string;
  wrapper?: (contextText: string, contentKey?: string) => string;
}


interface FileData {
  path: string;
  content: string;
}


function defaultWrapper(contextText: string, contentKey?: string) {
  return contextText
}
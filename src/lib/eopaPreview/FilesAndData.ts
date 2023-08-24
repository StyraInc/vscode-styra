import * as yaml from 'js-yaml';
import {ArgumentError, FileError} from './errors';
import {extname, join, sep} from 'path';
import {FileSystem, FileType, Uri} from 'vscode';
import globMatch = require('picomatch');

type Files = {[path: string]:string};
type Data = {[path: string]:any}; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * FilesAndData holds a set of rego files and data objects for a preview
 */
export class FilesAndData {
  _files: Files;
  _data: Data;
  _prefix: string;

  constructor(files: Files, data: Data) {
    this._files = files;
    this._data = data;
    this._prefix = '';
  }

  combine(source: FilesAndData): FilesAndData {
    const files = Object.assign({}, this._files, source._files);
    const data = Object.assign({}, this._data, source._data);

    return new FilesAndData(files, data).setPrefix(this._prefix);
  }

  setPrefix(prefix: string): FilesAndData {
    this._prefix = prefix;
    return this;
  }

  hasData(): boolean {
    return Object.keys(this.data).length > 0;
  }

  hasFiles(): boolean {
    return Object.keys(this.files).length > 0;
  }

  get data(): Data {
    return this._data;
  }

  get files(): Files {
    const files: Files = {};
    for (const file in this._files) {
      files[join(this._prefix, file)] = this._files[file];
    }

    return files;
  }

  addData(path: string[], data: unknown) {
    const lastPart = path.pop();
    if (lastPart === undefined) {
      throw new ArgumentError('data path must have at least one element');
    }
    let dataObject = this.data;
    for (const key of path) {
      if (typeof dataObject[key] === 'undefined') {
        dataObject[key] = {};
        dataObject = dataObject[key];
      } else if (typeof dataObject[key] === 'object') {
        dataObject = dataObject[key];
      }
    }
    dataObject[lastPart] = data;
  }

  addFile(path: string, value: string) {
    this._files[path] = value;
  }
}

/**
 * Recursively gather files and data from a specific root in the file system.
 *
 * @param fs The VS Code file system implementation
 * @param root The root file URI to start searching for files to add in the file system
 * @param prefix The prefix to prepend to the final Fils
 * @param fsPrefix Any prefix path to add to the file when adding it to the current files and data
 * @param ignored Any file or directory names to ignore when searching the file system
 * @returns A promise containing a FilesAndData object with all found files and data from the initial root.
 */
export async function fsFilesAndData(fs: FileSystem, root: Uri, prefix: string, ignored: string[]): Promise<FilesAndData> {
  let filesAndData = new FilesAndData({}, {});
  const dir = await fs.readDirectory(root);
  const addData = fsDataAdder(fs, filesAndData, root, prefix);
  const ignoreMatcher = globMatch(ignored, {dot: true});

  for (const item of dir) {
    if (ignoreMatcher(join(prefix, item[0]))) {
      continue;
    }
    try {
      switch (item[1]) {
        case FileType.File:
          if (item[0].toLowerCase() === 'data.yaml') {
            await addData(item[0], yaml.load);
            continue;
          } else if (item[0].toLowerCase() === 'data.json') {
            await addData(item[0], JSON.parse);
            continue;
          } else if (extname(item[0]).toLowerCase() !== '.rego') {
            continue;
          }
          {
            const fileUri = root.with({path: join(root.path, item[0])});
            const text = await fs.readFile(fileUri);
            filesAndData.addFile(prefix + item[0], text.toString());
          }
          break;
        case FileType.Directory:
          {
            const dirUri = root.with({path: join(root.path, item[0])});
            const sub = await fsFilesAndData(fs, dirUri, prefix + item[0] + '/', ignored);
            filesAndData = filesAndData.combine(sub);
          }
          break;
      }
    } catch (e: unknown) {
      if (!(e instanceof FileError) && e instanceof Error) {
        throw new FileError(e, join(root.path, item[0]));
      }
      throw e;
    }
  }
  return filesAndData;
}

/**
 * Creates a function which will add data from a file to the data object at the specified data path
 *
 * The function returned takes a parser, allowing support for multiple types of files.
 *
 * @param fs The file system to fetch files from
 * @param filesAndData The Files and Data object to add data to
 * @param root The root path where the data has been located
 * @param dataPath The relative file path to use as a data path
 * @returns A function which when given a file name and a parser will read and parse the data adding it to the data in FilesAndData at the dataPath
 */
function fsDataAdder(fs: FileSystem, filesAndData: FilesAndData, root: Uri, dataPath: string): (name: string, parser: (data: string) => unknown) => Promise<void> {
  let _dataPath = dataPath;
  return async (name: string, parser: (data: string) => unknown) => {
    const fileUri = root.with({path: join(root.path, name)});
    const text = await fs.readFile(fileUri);
    const data = parser(text.toString());
    if (_dataPath.endsWith(sep)) {
      _dataPath = _dataPath.substring(0, dataPath.length - 1);
    }
    const pathParts = dataPath.split(sep);
    filesAndData.addData(pathParts, data);
  };
}

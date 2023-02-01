import {LocalStorageService} from '../../lib/local-storage-service';
import {Memento} from 'vscode';

class TestMemento implements Memento {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private data: { [key: string]: any } = {};

  public keys(): readonly string[] {
    return Object.keys(this.data);
  }

  public get<T>(key: string): T | undefined {
    return this.data[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public update(key: string, value: any): Thenable<void> {
    this.data[key] = value;
    return Promise.resolve();
  }
}

describe('LocalStorageService', () => {

  const storageMgr = LocalStorageService.instance;

  test('using without initializing the store always returns null', () => {
    storageMgr.setValue<string>('foo', 'abc');
    expect(storageMgr.getValue<string>('foo')).toBeNull();
  });

  test('can store and retrieve one item', () => {
    const storage = new TestMemento();
    storageMgr.storage = storage;
    storageMgr.setValue<string>('foo', 'abc');
    expect(storageMgr.getValue<string>('foo')).toBe('abc');
    expect(storage.keys().length).toBe(1);
  });

  test('can store and overwrite one item', () => {
    const storage = new TestMemento();
    storageMgr.storage = storage;
    storageMgr.setValue<string>('foo', 'abc');
    expect(storageMgr.getValue<string>('foo')).toBe('abc');
    storageMgr.setValue<string>('foo', 'def');
    expect(storageMgr.getValue<string>('foo')).toBe('def');
    expect(storage.keys().length).toBe(1);
  });

  test('can store multiple items of different types', () => {
    storageMgr.storage = new TestMemento();
    storageMgr.setValue('foo', 123);
    storageMgr.setValue('bar', true);
    storageMgr.setValue('baz', {a: 1, b: 5.3});
    expect(storageMgr.getValue('foo')).toBe(123);
    expect(storageMgr.getValue('bar')).toBe(true);
    expect(storageMgr.getValue('baz')).toStrictEqual({a: 1, b: 5.3});
  });

});

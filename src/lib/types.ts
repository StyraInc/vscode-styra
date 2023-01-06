// partial definition
export type System = {
  id: string;
  name: string;
};

export interface ICommand {
  run: () => Promise<void>;
}

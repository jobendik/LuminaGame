export interface IState {
  enter?: () => void;
  update?: (delta: number) => void;
  exit?: () => void;
}

export class StateMachine {
  private states = new Map<string, IState>();
  private _currentState: string | null = null;

  get currentState(): string | null {
    return this._currentState;
  }

  addState(name: string, state: IState): this {
    this.states.set(name, state);
    return this;
  }

  transition(name: string): void {
    if (name === this._currentState) return;
    if (!this.states.has(name)) {
      console.warn(`StateMachine: state "${name}" does not exist.`);
      return;
    }

    if (this._currentState) {
      this.states.get(this._currentState)?.exit?.();
    }

    this._currentState = name;
    this.states.get(name)?.enter?.();
  }

  update(delta: number): void {
    if (this._currentState) {
      this.states.get(this._currentState)?.update?.(delta);
    }
  }
}

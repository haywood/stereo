import assert from 'assert';

import endent from 'endent';

import debug from '../../debug';
import { pp } from '../../pp';
import { NonTerminal } from './non_terminal';
import { Pipe } from './pipe';
import { Scalar } from './scalar';
import { State } from './state';
import { Error } from './error';

const ctxs = [];
debug('pipe_ctxs', ctxs);

export class Context {
  constructor(
    readonly root: NonTerminal,       
    private readonly stack: NonTerminal[],
    private readonly queue: State[],
    private readonly elements: string[],
    private readonly then: (ast) => void
    ) {
    this.enqueue(root);
  }

  static pipe(then: (ast) => void): Context {
    const ctx = new Context(new Pipe(), [], [], [], then);
    ctxs.push(ctx);
    return ctx;
  }

  static scalar(then: (ast) => void): Context {
    const ctx = new Context(new Scalar(), [], [], [], then);
    ctxs.push(ctx);
    return ctx;
  }

  apply(stream): string {
    let style;

    if (stream.eatSpace()) {
      style = 'space';
    } else if (this.peek()) {
      style = this.applyFromQueue(stream);
    } else {
      this.applyFromStack(stream);
    }

    if (eoi(stream)) {
      this.drain(stream);
    }

    return style;
  }

  clone(): Context {
    return this;
  }

  enqueue(state: State) {
    this.queue.push(state);
  }

  private top(): State {
    return this.stack[this.stack.length - 1];
  }

  private applyFromQueue(stream): string {
    const state = this.dequeue()!;
    const queued = this.queue.length;
    const style = state.apply(stream, this);

    const queueErrorIfNoSuccessors = () => {
      if (this.queue.length == queued) {
        this.enqueue(new Error());
      }
    }

    if (style) {
      const value = state.evaluate(this, stream);
      if (value) this.top().values.push(value);
    } else if (state instanceof NonTerminal) {
      // a non-terminal that doesn't match should enqueue something
      queueErrorIfNoSuccessors();

      this.push(state);
    } else if (!this.peek()) {
      // any node that doesn't match should enqueue something
      queueErrorIfNoSuccessors();

      this.applyFromStack(stream);
    }

    return style;
  }

  private applyFromStack(stream): void {
    const pending = this.pop();
    if (this.stack.length) {
      const result = pending.evaluate(this, stream);
      this.top().values.push(result);
    } else {
      this.enqueue(pending);
    }
  }

  private drain(stream) {
    const { queue, stack } = this;
    assert.equal(
      queue.length,
      0,
      `expected empty queue while draining: [${queue.join(', ')}]`
    );

    while (this.stack.length > 1) {
      const pending = this.pop();
      const result = pending.evaluate(this, stream);
      this.top().values.push(result);
    }

    const value = this.top().evaluate(this, stream);
    console.debug('Context.drain()\n', this, '\n\tproduced', value);

    this.then(value);
  }

  private peek(): State {
    return this.queue[0];
  }

  private pop(): State {
    return this.stack.pop();
  }

  private push(state: NonTerminal) {
    return this.stack.push(state);
  }

  private dequeue(): State {
    return this.queue.shift();
  }
}

function eoi(stream) {
  const lineCount = stream.lineOracle.doc.size;
  const line = stream.lineOracle.line;
  return stream.eol() && line == lineCount - 1;
}

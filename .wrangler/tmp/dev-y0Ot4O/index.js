var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// worker/emails/resetPassword.ts
function getResetPasswordEmail(newPassword) {
  const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; }
                    .wrapper { background-color: #f7fafc; padding: 40px 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
                    .header { background-color: #000000; padding: 30px; text-align: center; }
                    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 2px; font-weight: 700; }
                    .body { padding: 40px; }
                    .alert-title { font-size: 20px; font-weight: 700; color: #2d3748; margin-bottom: 20px; }
                    .password-box { background-color: #edf2f7; border: 2px dashed #cbd5e0; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
                    .password-text { font-family: 'Courier New', Courier, monospace; font-size: 28px; font-weight: bold; color: #2b6cb0; letter-spacing: 4px; }
                    .button-container { text-align: center; margin-top: 30px; }
                    .button { background-color: #3182ce; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; }
                    .footer { padding: 25px; text-align: center; font-size: 13px; color: #718096; background-color: #f8fafc; }
                    .warning { font-size: 12px; color: #a0aec0; margin-top: 20px; border-top: 1px solid #edf2f7; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="wrapper">
                    <div class="container">
                        <div class="header">
                            <h1>DIGITALSIGHT</h1>
                        </div>
                        <div class="body">
                            <div class="alert-title">Credential Recovery Protocol</div>
                            <p>Hello,</p>
                            <p>We received a request to access your DigitalSight vault. A temporary access key has been generated for your account.</p>
                            
                            <div class="password-box">
                                <div style="font-size: 12px; color: #718096; margin-bottom: 8px; text-transform: uppercase;">Temporary Key</div>
                                <div class="password-text">${newPassword}</div>
                            </div>

                            <p>Please use this key to log in. You will be required to change this password immediately after access is restored.</p>
                            
                            <div class="button-container">
                                <a href="https://app.digitalsight.in/login" class="button">Log In to Vault</a>
                            </div>

                            <div class="warning">
                                If you did not request this reset, please ignore this email or contact security support if you have concerns about your account.
                            </div>
                        </div>
                        <div class="footer">
                            &copy; 2026 DigitalSight <br>
                            Managed via Cloudflare Shielded Infrastructure
                        </div>
                    </div>
                </div>
            </body>
            </html>
            `;
  const text = `Hello,

Your new temporary vault key is: ${newPassword}

Login here: https://digitalsight.in/login`;
  return { html, text };
}
__name(getResetPasswordEmail, "getResetPasswordEmail");

// worker/emails/welcome.ts
function getWelcomeEmail(name, passwordToSave) {
  const subject = "Welcome to Digitalsight";
  const text = `Hello ${name},

Your account has been created.
Your temporary password is: ${passwordToSave}

Please log in at https://digitalsight.in/login and change your password.`;
  const html = `<h3>Welcome to Digitalsight</h3><p>Hello ${name},</p><p>Your account has been created.</p><p>Temporary Password: <b>${passwordToSave}</b></p><p>Please log in at <a href="https://digitalsight.in/login">https://digitalsight.in/login</a> and change your password.</p>`;
  return { subject, html, text };
}
__name(getWelcomeEmail, "getWelcomeEmail");

// worker/emails/labelRegistration.ts
function getLabelRegistrationEmail(adminName, labelName, adminEmail, passwordToSave) {
  const subject = "Label Registration - Digitalsight";
  const text = `Hello ${adminName},

Your label "${labelName}" has been registered on Digitalsight.
Your admin account has been created.

Email: ${adminEmail}
Password: ${passwordToSave}

Please log in at https://digitalsight.in/login and complete your profile.`;
  const html = `<h3>Label Registration - Digitalsight</h3><p>Hello ${adminName},</p><p>Your label "<b>${labelName}</b>" has been registered on Digitalsight.</p><p>Admin Account Created:</p><ul><li>Email: ${adminEmail}</li><li>Password: ${passwordToSave}</li></ul><p>Please log in at <a href="https://digitalsight.in/login">https://digitalsight.in/login</a> and complete your profile.</p>`;
  return { subject, html, text };
}
__name(getLabelRegistrationEmail, "getLabelRegistrationEmail");

// worker/emails/correction.ts
function getCorrectionEmail(title2, upc, createdAt, message, id) {
  const subject = `Action Required: Correction Request for "${title2}"`;
  const html = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                                .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                .header { background-color: #000; padding: 20px; text-align: center; }
                                .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
                                .content { padding: 30px; }
                                .alert-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                                .alert-title { font-weight: bold; color: #d39e00; margin-bottom: 5px; display: block; font-size: 14px; text-transform: uppercase; }
                                .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                .meta-table td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
                                .meta-label { font-weight: bold; color: #666; width: 120px; }
                                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                                .button { display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>DIGITALSIGHT</h1>
                                </div>
                                <div class="content">
                                    <h2 style="margin-top: 0; color: #1a1a1a;">Correction Required</h2>
                                    <p>Hello,</p>
                                    <p>The following release has been flagged by our Quality Assurance team and requires your attention before it can be distributed.</p>
                                    
                                    <table class="meta-table">
                                        <tr>
                                            <td class="meta-label">Release Title</td>
                                            <td><strong>${title2}</strong></td>
                                        </tr>
                                        <tr>
                                            <td class="meta-label">UPC</td>
                                            <td>${upc || "Pending"}</td>
                                        </tr>
                                        <tr>
                                            <td class="meta-label">Submission Date</td>
                                            <td>${new Date(createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    </table>

                                    <div class="alert-box">
                                        <span class="alert-title">Correction Directive</span>
                                        ${message}
                                    </div>

                                    <p>Please log in to the portal to address these issues and resubmit the release.</p>
                                    
                                    <div style="text-align: center;">
                                        <a href="https://app.digitalsight.in/releases/${id}" class="button" style="color: white; text-decoration: none;">Fix Metadata</a>
                                    </div>
                                </div>
                                <div class="footer">
                                    &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} DigitalSight. All rights reserved.<br>
                                    This is an automated message. Please do not reply directly to this email.
                                </div>
                            </div>
                        </body>
                        </html>
                        `;
  const text = `Correction Required for "${title2}".

Note: ${message}

Please login to fix: https://app.digitalsight.in/releases/${id}`;
  return { subject, html, text };
}
__name(getCorrectionEmail, "getCorrectionEmail");

// worker/emails/publication.ts
function getPublicationEmail(releaseTitle, upc, releaseDate, labelName, id) {
  const subject = `\u{1F680} Published: "${releaseTitle}" is now live!`;
  const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                            .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center; }
                            .header h1 { color: #fff; margin: 0; font-size: 28px; letter-spacing: 4px; font-weight: 900; text-transform: uppercase; }
                            .content { padding: 40px; }
                            .success-badge { background-color: #e8f5e9; color: #2e7d32; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; display: inline-block; margin-bottom: 20px; }
                            .release-title { font-size: 24px; font-weight: 900; color: #1a1a1a; margin: 0 0 10px 0; line-height: 1.2; }
                            .meta-container { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0; }
                            .meta-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                            .meta-row:last-child { border-bottom: none; }
                            .meta-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; }
                            .meta-value { font-size: 14px; color: #1a1a1a; font-weight: bold; }
                            .footer { background-color: #f8f9fa; padding: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
                            .button { display: inline-block; background-color: #000; color: #fff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>DIGITALSIGHT</h1>
                            </div>
                            <div class="content">
                                <div class="success-badge">\u2713 Published & Live</div>
                                <h2 class="release-title">${releaseTitle}</h2>
                                <p>Congratulations! Your release has been successfully processed and delivered to global digital stores.</p>
                                
                                <div class="meta-container">
                                    <div class="meta-row">
                                        <span class="meta-label">UPC Code</span>
                                        <span class="meta-value">${upc}</span>
                                    </div>
                                    <div class="meta-row">
                                        <span class="meta-label">Release Date</span>
                                        <span class="meta-value">${releaseDate}</span>
                                    </div>
                                    <div class="meta-row">
                                        <span class="meta-label">Label</span>
                                        <span class="meta-value">${labelName}</span>
                                    </div>
                                    <div class="meta-row">
                                        <span class="meta-label">Status</span>
                                        <span class="meta-value" style="color: #2e7d32;">Published</span>
                                    </div>
                                </div>

                                <p>Your music is now on its way to Spotify, Apple Music, Amazon, and 150+ other platforms. It typically takes 24-48 hours for the release to appear across all stores.</p>
                                
                                <div style="text-align: center;">
                                    <a href="https://app.digitalsight.in/releases/${id}" class="button">View Release Details</a>
                                </div>
                            </div>
                            <div class="footer">
                                &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} DigitalSight. Global Music Distribution.<br>
                                Managed via Cloudflare Shielded Infrastructure.
                            </div>
                        </div>
                    </body>
                    </html>
                    `;
  const text = `Congratulations! Your release "${releaseTitle}" has been published.
UPC: ${upc}
Release Date: ${releaseDate}
Label: ${labelName}

View details: https://app.digitalsight.in/releases/${id}`;
  return { subject, html, text };
}
__name(getPublicationEmail, "getPublicationEmail");

// worker/genres.json
var genres_default = {
  Film: ["Romantic /Love Songs", "Sad Songs", "Devotional", "Instrumental", "BGM", "Band Songs", "Chill Pop", "Contemporary Pop", "Country Pop/ Regional Pop", "Dance Pop", "Electro Pop", "Indian Pop", "Lo-Fi Pop", "Love Songs", "Punjabi Pop", "Rock", "Soft Rock"],
  Pop: ["Indian Pop", "Punjabi Pop", "Rock", "Chill Pop", "Contemporary Pop", "Country Pop/ Regional Pop", "Dance Pop", "Electro Pop", "Lo-Fi Pop", "Band Songs", "Sad Songs", "Soft Rock"],
  Indie: ["Indian Indie", "Indie Dance", "Indie Folk", "Indie Hip-Hop", "Indie Lo-Fi", "Indie Pop", "Indie Rock", "Indie Singer -Songwriter"],
  "HipHop/Rap": ["Alternative Rap", "Gangsta Rap", "Hardcore Rap", "Hip Hop/Rap", "Hip-Hop", "Old School Rap", "Rap", "Underground Rap"],
  Folk: ["Ainchaliyan", "Alha", "Atulprasadi", "Baalgeet/ Children Song", "Banvarh", "Barhamasa", "Basant Geet", "Baul Geet", "Bhadu Gaan", "Bhagawati", "Bhand", "Bhangra", "Bhatiali", "Bhavageete", "Bhawaiya", "Bhuta song", "Bihugeet", "Birha", "Borgeet", "Burrakatha", "Chappeli", "Daff", "Dandiya Raas", "Dasakathia", "Deijendrageeti", "Deknni", "Dhamal", "Gadhwali", "Gagor", "Garba", "Ghasiyari Geet", "Ghoomar", "Gidda", "Gugga", "Hafiz Nagma", "Heliam", "Hereileu", "Hori", "Jaanapada Geethe", "Jaita", "Jhoori", "Jhora", "Jhumur", "Jugni", "Kajari", "Kajari/ Kajari /Kajri", "Karwa Chauth Songs", "Khor", "Koligeet", "Kumayuni", "Kummi Paatu", "Lagna Geet /Marriage Song", "Lalongeeti", "Lavani", "Lokgeet", "Loor", "Maand", "Madiga Dappu", "Mando", "Mapilla", "Naatupura Paadalgal", "Naqual", "Nati", "Nautanki", "Nazrulgeeti", "Neuleu", "Nyioga", "Oggu Katha", "Paani Hari", "Pai Song", "Pandavani", "Pankhida", "Patua Sangeet", "Phag Dance", "Powada", "Qawwali", "Rabindra Sangeet", "Rajanikantageeti", "Ramprasadi", "Rasiya", "Rasiya Geet", "Raslila", "Raut Nacha", "Saikuthi Zai", "Sana Lamok", "Shakunakhar-Mangalgeet", "Shyama Sangeet", "Sohar", "Sumangali", "Surma", "Suvvi paatalu", "Tappa", "Teej songs", "Tusu Gaan", "Villu Pattu", "Qawwals"],
  Devotional: ["Aarti", "Bhajan", "Carol", "Chalisa", "Chant", "Geet", "Gospel", "Gurbani", "Hymn", "Kirtan", "Mantra", "Paath", "Islamic", "Shabd", "Christian Pop", "Christian Rock"],
  "Hindustani Classical": ["Instrumental", "Vocal"],
  "Carnatic Classical": ["Instrumental", "Vocal"],
  "Ambient/Instrumental": ["Soft", "Easy Listening", "Lounge", "Ambient", "Relaxation"],
  Dance: ["Dance", "Breakbeat", "Garage", "Bass", "House", "Techno", "Trance"],
  Electronic: ["Electronic", "Ambient", "Bass", "Downtempo", "Dubstep", "Electro-Cha'abi", "Electronica", "IDM/Experimental", "Industrial"],
  Rock: ["Pop/Rock", "Rock", "Adult Alternative", "Arena Rock", "Blues-Rock", "Death Metal/Black Metal", "Glam Rock", "Hair Metal", "Hard Rock", "Heavy Metal", "Jam Bands", "Prog-Rock/Art Rock", "Psychedelic", "Rock & Roll", "Rockabilly", "Roots Rock", "Singer/Songwriter", "Surf"],
  "New Age": ["New Age", "Healing", "Meditation", "Nature", "Yoga"],
  Worldwide: ["Worldwide", "Asia"],
  "Children's Music": ["Children's Music", "Lullabies", "Sing-Along", "Stories"]
};

// worker/index.ts
var worker_default = {
  async fetch(request, env2, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, "");
    const method = request.method;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      if (path === "/genres" && method === "GET") {
        return await handleGenres(corsHeaders);
      }
      if (path === "/auth/login" && method === "POST") {
        return await handleLogin(request, env2, corsHeaders);
      }
      if (path === "/auth/verify" && method === "GET") {
        return await handleVerifyAuth(request, env2, corsHeaders);
      }
      if (path === "/auth/change-password" && method === "POST") {
        const user2 = await authenticate(request, env2);
        if (!user2) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return await handleChangePassword(request, env2, corsHeaders, user2);
      }
      if (path === "/auth/reset-password" && method === "POST") {
        return await handleResetPassword(request, env2, corsHeaders);
      }
      const user = await authenticate(request, env2);
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (path.startsWith("/users")) {
        const user2 = await authenticate(request, env2);
        if (!user2) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const isPlatformSide = user2.role === "Owner" || user2.role === "Employee";
        if (!isPlatformSide && !(user2.role === "Label Admin")) {
          const adminCheck = await requireAdmin(request, env2, corsHeaders);
          if (adminCheck.error) return adminCheck.error;
        }
        return await handleUsers(request, env2, corsHeaders, user2);
      }
      if (path.startsWith("/labels")) {
        if (method !== "GET") {
          const user2 = await authenticate(request, env2);
          if (!user2) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          const isPlatformSide = user2.role === "Owner" || user2.role === "Employee";
          if (!isPlatformSide && !(method === "POST" && user2.role === "Label Admin" && user2.permissions?.canCreateSubLabels)) {
            const adminCheck = await requireAdmin(request, env2, corsHeaders);
            if (adminCheck.error) return adminCheck.error;
          }
        } else {
          const user2 = await authenticate(request, env2);
          if (!user2) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return await handleLabels(request, env2, corsHeaders);
      }
      if (path.startsWith("/artists")) {
        if (method !== "GET" && method !== "POST" && method !== "PUT" && method !== "DELETE") {
          const adminCheck = await requireAdmin(request, env2, corsHeaders);
          if (adminCheck.error) return adminCheck.error;
        }
        return await handleArtists(request, env2, corsHeaders, user);
      }
      if (path === "/releases/export" && method === "GET") {
        const adminCheck = await requireAdmin(request, env2, corsHeaders);
        if (adminCheck.error) return adminCheck.error;
        return await handleExportReleases(request, env2, corsHeaders);
      }
      if (path.startsWith("/releases")) return await handleReleases(request, env2, corsHeaders, user);
      if (path.startsWith("/notices")) {
        if (method !== "GET") {
          const adminCheck = await requireAdmin(request, env2, corsHeaders);
          if (adminCheck.error) return adminCheck.error;
        }
        return await handleNotices(request, env2, corsHeaders, user);
      }
      if (path.startsWith("/revenue")) {
        const adminCheck = await requireAdmin(request, env2, corsHeaders);
        if (adminCheck.error) return adminCheck.error;
        return await handleRevenue(request, env2, corsHeaders);
      }
      if (path.startsWith("/search")) return await handleSearch(request, env2, corsHeaders);
      if (path.startsWith("/stats")) return await handleStats(request, env2, corsHeaders);
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }
};
async function handleLogin(request, env2, corsHeaders) {
  const { email, password, token } = await request.json();
  const turnstileResult = await verifyTurnstile(token, env2.TURNSTILE_SECRET_KEY);
  if (!turnstileResult.success && token !== "1x00000000000000000000AA") {
    return new Response(JSON.stringify({ error: "Captcha verification failed" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const user = await env2.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user || user.password_hash !== password) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const mappedUser = mapUser(user);
  const jwt = await signJwt({
    sub: user.id,
    email: user.email,
    role: user.role,
    labelId: user.label_id,
    artistId: user.artist_id
  }, env2.JWT_SECRET);
  return new Response(JSON.stringify({ token: jwt, user: mappedUser }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
__name(handleLogin, "handleLogin");
async function handleVerifyAuth(request, env2, corsHeaders) {
  const payload = await authenticate(request, env2);
  if (!payload) return new Response(JSON.stringify({ valid: false }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const user = await env2.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.sub).first();
  if (!user) return new Response(JSON.stringify({ valid: false }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ valid: true, user: mapUser(user) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
__name(handleVerifyAuth, "handleVerifyAuth");
async function handleGenres(corsHeaders) {
  return new Response(JSON.stringify(genres_default), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
__name(handleGenres, "handleGenres");
async function handleChangePassword(request, env2, corsHeaders, currentUser) {
  try {
    const { oldPass, newPass } = await request.json();
    const user = await env2.DB.prepare("SELECT * FROM users WHERE id = ?").bind(currentUser.sub).first();
    if (!user || user.password_hash !== oldPass) {
      return new Response(JSON.stringify({ error: "Incorrect current password" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    await env2.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newPass, currentUser.sub).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to update password" }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
__name(handleChangePassword, "handleChangePassword");
async function sendZeptoEmail(env2, to, subject, htmlBody, textBody) {
  const response = await fetch("https://api.zeptomail.in/v1.1/email", {
    method: "POST",
    headers: {
      "Authorization": env2.ZEPTOMAIL_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: { address: "no-reply@digitalsight.in", name: "DigitalSight" },
      to: [{ email_address: { address: to } }],
      subject,
      htmlbody: htmlBody,
      textbody: textBody
    })
  });
  if (!response.ok) {
    const error3 = await response.text();
    throw new Error(`ZeptoMail failed: ${error3}`);
  }
  return response;
}
__name(sendZeptoEmail, "sendZeptoEmail");
async function handleResetPassword(request, env2, corsHeaders) {
  try {
    const { email } = await request.json();
    const user = await env2.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!user) {
      return new Response(JSON.stringify({ error: "User email not registered yet." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const array = new Uint8Array(10);
    crypto.getRandomValues(array);
    const newPassword = Array.from(
      array,
      (byte) => byte.toString(36).padStart(1, "0")
    ).join("").slice(0, 10).toUpperCase();
    await env2.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newPassword, user.id).run();
    try {
      const { html: htmlTemplate, text: textBody } = getResetPasswordEmail(newPassword);
      await sendZeptoEmail(env2, user.email, "Credential Recovery Protocol", htmlTemplate, textBody);
    } catch (e) {
      console.error("ZeptoMail delivery failed:", e.message);
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error3) {
    console.error("Reset Password Error:", error3);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleResetPassword, "handleResetPassword");
async function getUserLabelId(env2, currentUser) {
  if (currentUser.labelId) return currentUser.labelId;
  const userRecord = await env2.DB.prepare("SELECT label_id FROM users WHERE id = ?").bind(currentUser.sub).first();
  return userRecord?.label_id;
}
__name(getUserLabelId, "getUserLabelId");
async function handleUsers(request, env2, corsHeaders, currentUser) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (request.method === "GET") {
    if (id && id !== "users") {
      const user = await env2.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
      if (!user) return new Response(null, { status: 404, headers: corsHeaders });
      const isPlatformSide2 = currentUser.role === "Owner" || currentUser.role === "Employee";
      if (!isPlatformSide2) {
        if (user.label_id !== currentUser.labelId) {
          const isSubLabel = await env2.DB.prepare(`
                        WITH RECURSIVE sub_labels AS (
                            SELECT id FROM labels WHERE id = ?
                            UNION ALL
                            SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                        )
                        SELECT 1 FROM sub_labels WHERE id = ?
                    `).bind(currentUser.labelId, user.label_id).first();
          if (!isSubLabel) {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
      }
      return new Response(JSON.stringify(mapUser(user)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let query = "SELECT * FROM users";
    let params = [];
    const isPlatformSide = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isPlatformSide) {
      query = `
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT * FROM users WHERE label_id IN (SELECT id FROM sub_labels)
            `;
      params = [currentUser.labelId];
    }
    const { results } = await env2.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(results.map(mapUser)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "POST") {
    const data = await request.json();
    const newId = crypto.randomUUID();
    const randomPassword = Math.random().toString(36).slice(-8);
    const passwordToSave = data.password || randomPassword;
    const isPlatformSide = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isPlatformSide) {
      const isAuthorized = await env2.DB.prepare(`
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT 1 FROM sub_labels WHERE id = ?
            `).bind(currentUser.labelId, data.labelId).first();
      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    await env2.DB.prepare("INSERT INTO users (id, name, email, password_hash, role, designation, label_id, artist_id, permissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(newId, sanitize(data.name), sanitize(data.email), sanitize(passwordToSave), sanitize(data.role), sanitize(data.designation), sanitize(data.labelId), sanitize(data.artistId), JSON.stringify(data.permissions)).run();
    try {
      const { subject, html: htmlBody, text: textBody } = getWelcomeEmail(data.name, passwordToSave);
      await sendZeptoEmail(env2, data.email, subject, htmlBody, textBody);
    } catch (e) {
      console.error("Welcome email failed:", e);
    }
    return new Response(JSON.stringify({ id: newId, ...data, password: passwordToSave }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "PUT" && id) {
    const data = await request.json();
    const current = await env2.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    if (!current) return new Response(null, { status: 404, headers: corsHeaders });
    const isPlatformSide = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isPlatformSide) {
      const isAuthorized = await env2.DB.prepare(`
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT 1 FROM sub_labels WHERE id = ?
            `).bind(currentUser.labelId, current.label_id).first();
      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    const name = data.name !== void 0 ? data.name : current.name;
    const role = data.role !== void 0 ? data.role : current.role;
    const designation = data.designation !== void 0 ? data.designation : current.designation;
    const permissions = data.permissions !== void 0 ? JSON.stringify(data.permissions) : current.permissions;
    const isBlocked = data.isBlocked !== void 0 ? data.isBlocked ? 1 : 0 : current.is_blocked;
    const blockReason = data.blockReason !== void 0 ? data.blockReason : current.block_reason;
    await env2.DB.prepare("UPDATE users SET name = ?, role = ?, designation = ?, permissions = ?, is_blocked = ?, block_reason = ? WHERE id = ?").bind(sanitize(name), sanitize(role), sanitize(designation), permissions, isBlocked, sanitize(blockReason), id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "DELETE" && id) {
    const current = await env2.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    if (!current) return new Response(null, { status: 404, headers: corsHeaders });
    const isPlatformSide = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isPlatformSide) {
      const isAuthorized = await env2.DB.prepare(`
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT 1 FROM sub_labels WHERE id = ?
            `).bind(currentUser.labelId, current.label_id).first();
      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    await env2.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return new Response(null, { status: 405, headers: corsHeaders });
}
__name(handleUsers, "handleUsers");
async function handleLabels(request, env2, corsHeaders) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  const currentUser = await authenticate(request, env2);
  if (!currentUser) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (request.method === "GET") {
    if (id && id !== "labels") {
      const label = await env2.DB.prepare(`
                SELECT l.*, u.email as owner_email 
                FROM labels l 
                LEFT JOIN users u ON l.owner_id = u.id 
                WHERE l.id = ?
            `).bind(id).first();
      if (!label) return new Response(null, { status: 404, headers: corsHeaders });
      const isPlatformSide2 = currentUser.role === "Owner" || currentUser.role === "Employee";
      if (!isPlatformSide2) {
        if (label.id !== currentUser.labelId) {
          const isSubLabel = await env2.DB.prepare(`
                        WITH RECURSIVE sub_labels AS (
                            SELECT id FROM labels WHERE id = ?
                            UNION ALL
                            SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                        )
                        SELECT 1 FROM sub_labels WHERE id = ?
                    `).bind(currentUser.labelId, label.id).first();
          if (!isSubLabel) {
            return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }
      }
      return new Response(JSON.stringify(mapLabel(label)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let query = `
            SELECT l.*, u.email as owner_email 
            FROM labels l 
            LEFT JOIN users u ON l.owner_id = u.id
        `;
    let params = [];
    const isPlatformSide = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isPlatformSide) {
      query = `
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT l.*, u.email as owner_email 
                FROM labels l 
                LEFT JOIN users u ON l.owner_id = u.id
                WHERE l.id IN (SELECT id FROM sub_labels)
            `;
      params = [currentUser.labelId];
    }
    const { results } = await env2.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(results.map(mapLabel)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "POST") {
    const data = await request.json();
    const labelId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    const randomPassword = Math.random().toString(36).slice(-8);
    const passwordToSave = data.adminPassword || randomPassword;
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      if (data.parentLabelId !== currentUser.labelId) {
        return new Response(JSON.stringify({ error: "Forbidden: Cannot create sub-label for another label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    await env2.DB.prepare(`
            INSERT INTO labels (id, name, parent_label_id, owner_id, address, city, country, tax_id, website, phone, revenue_share, max_artists, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      labelId,
      sanitize(data.name),
      sanitize(data.parentLabelId),
      userId,
      // The new admin will be the owner
      sanitize(data.address),
      sanitize(data.city),
      sanitize(data.country),
      sanitize(data.taxId),
      sanitize(data.website),
      sanitize(data.phone),
      sanitize(data.revenueShare),
      sanitize(data.maxArtists),
      "Active"
    ).run();
    await env2.DB.prepare(`
            INSERT INTO users (id, name, email, password_hash, role, label_id, label_name, permissions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      userId,
      sanitize(data.adminName),
      sanitize(data.adminEmail),
      passwordToSave,
      "Label Admin",
      labelId,
      sanitize(data.name),
      JSON.stringify(data.permissions || {})
    ).run();
    const label = await env2.DB.prepare("SELECT * FROM labels WHERE id = ?").bind(labelId).first();
    const user = await env2.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
    const mappedLabel = mapLabel(label);
    const mappedUser = mapUser(user);
    if (mappedUser) mappedUser.password = passwordToSave;
    try {
      const { subject, html: htmlBody, text: textBody } = getLabelRegistrationEmail(data.adminName, data.name, data.adminEmail, passwordToSave);
      await sendZeptoEmail(env2, data.adminEmail, subject, htmlBody, textBody);
    } catch (e) {
      console.error("Label admin email failed:", e);
    }
    return new Response(JSON.stringify({ label: mappedLabel, user: mappedUser }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "PUT" && id) {
    const data = await request.json();
    const current = await env2.DB.prepare("SELECT * FROM labels WHERE id = ?").bind(id).first();
    if (!current) return new Response(null, { status: 404, headers: corsHeaders });
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      if (current.parent_label_id !== currentUser.labelId) {
        return new Response(JSON.stringify({ error: "Forbidden: Cannot update this label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    const name = data.name !== void 0 ? data.name : current.name;
    const parentLabelId = data.parentLabelId !== void 0 ? data.parentLabelId : current.parent_label_id;
    const ownerId = data.ownerId !== void 0 ? data.ownerId : current.owner_id;
    const address = data.address !== void 0 ? data.address : current.address;
    const city = data.city !== void 0 ? data.city : current.city;
    const country = data.country !== void 0 ? data.country : current.country;
    const taxId = data.taxId !== void 0 ? data.taxId : current.tax_id;
    const website = data.website !== void 0 ? data.website : current.website;
    const phone = data.phone !== void 0 ? data.phone : current.phone;
    const revenueShare = data.revenueShare !== void 0 ? data.revenueShare : current.revenue_share;
    const maxArtists = data.maxArtists !== void 0 ? data.maxArtists : current.max_artists;
    const status = data.status !== void 0 ? data.status : current.status;
    await env2.DB.prepare("UPDATE labels SET name = ?, parent_label_id = ?, owner_id = ?, address = ?, city = ?, country = ?, tax_id = ?, website = ?, phone = ?, revenue_share = ?, max_artists = ?, status = ? WHERE id = ?").bind(
      sanitize(name),
      sanitize(parentLabelId),
      sanitize(ownerId),
      sanitize(address),
      sanitize(city),
      sanitize(country),
      sanitize(taxId),
      sanitize(website),
      sanitize(phone),
      sanitize(revenueShare),
      sanitize(maxArtists),
      sanitize(status),
      id
    ).run();
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "DELETE" && id) {
    const current = await env2.DB.prepare("SELECT * FROM labels WHERE id = ?").bind(id).first();
    if (!current) return new Response(null, { status: 404, headers: corsHeaders });
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      if (current.parent_label_id !== currentUser.labelId) {
        return new Response(JSON.stringify({ error: "Forbidden: Cannot delete this label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    await env2.DB.prepare("DELETE FROM artists WHERE label_id = ?").bind(id).run();
    const { results: releases } = await env2.DB.prepare("SELECT id FROM releases WHERE label_id = ?").bind(id).all();
    for (const release2 of releases) {
      await env2.DB.prepare("DELETE FROM tracks WHERE release_id = ?").bind(release2.id).run();
      await env2.DB.prepare("DELETE FROM releases WHERE id = ?").bind(release2.id).run();
    }
    await env2.DB.prepare("DELETE FROM labels WHERE id = ?").bind(id).run();
    await env2.DB.prepare("DELETE FROM users WHERE label_id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return new Response(null, { status: 405, headers: corsHeaders });
}
__name(handleLabels, "handleLabels");
async function handleArtists(request, env2, corsHeaders, currentUser) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (request.method === "GET") {
    if (id && id !== "artists") {
      const artist = await env2.DB.prepare("SELECT * FROM artists WHERE id = ?").bind(id).first();
      return new Response(JSON.stringify(mapArtist(artist)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let query = "SELECT * FROM artists";
    let params = [];
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    const targetLabelId = url.searchParams.get("labelId");
    if (targetLabelId) {
      query = `
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT * FROM artists WHERE label_id IN (SELECT id FROM sub_labels)
            `;
      params = [targetLabelId];
    } else if (!isStaff) {
      const userLabelId = await getUserLabelId(env2, currentUser);
      if (userLabelId) {
        query = `
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT * FROM artists WHERE label_id IN (SELECT id FROM sub_labels)
                `;
        params = [userLabelId];
      } else {
        return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } else {
      query = "SELECT * FROM artists";
      params = [];
    }
    const { results } = await env2.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(results.map(mapArtist)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "POST") {
    const data = await request.json();
    const newId = crypto.randomUUID();
    const name = data.name;
    const labelId = data.labelId;
    const type = data.type;
    const spotifyId = data.spotifyId || null;
    const appleMusicId = data.appleMusicId || null;
    const instagramUrl = data.instagramUrl || null;
    const email = data.email || null;
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      const userLabelId = await getUserLabelId(env2, currentUser);
      if (labelId !== userLabelId) {
        const isAuthorized = await env2.DB.prepare(`
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT 1 FROM sub_labels WHERE id = ?
                `).bind(userLabelId, labelId).first();
        if (!isAuthorized) {
          return new Response(JSON.stringify({ error: "Forbidden: Cannot create artist for another label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }
    await env2.DB.prepare("INSERT INTO artists (id, name, label_id, type, spotify_id, apple_music_id, instagram_url, facebook_url, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(newId, name, labelId, type, spotifyId, appleMusicId, instagramUrl, data.facebookUrl || null, email).run();
    return new Response(JSON.stringify({ id: newId, ...data }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "PUT" && id) {
    const data = await request.json();
    console.log("Updating artist:", id, data);
    const name = data.name;
    const labelId = data.labelId;
    const type = data.type;
    const spotifyId = data.spotifyId || null;
    const appleMusicId = data.appleMusicId || null;
    const instagramUrl = data.instagramUrl || null;
    const email = data.email || null;
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      const userLabelId = await getUserLabelId(env2, currentUser);
      const artist = await env2.DB.prepare("SELECT label_id FROM artists WHERE id = ?").bind(id).first();
      if (!artist) return new Response(null, { status: 404, headers: corsHeaders });
      const isAuthorized = await env2.DB.prepare(`
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT 1 FROM sub_labels WHERE id = ?
            `).bind(userLabelId, artist.label_id).first();
      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: "Forbidden: Cannot update artist for another label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (labelId !== artist.label_id) {
        const isTargetAuthorized = await env2.DB.prepare(`
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT 1 FROM sub_labels WHERE id = ?
                `).bind(userLabelId, labelId).first();
        if (!isTargetAuthorized) {
          return new Response(JSON.stringify({ error: "Forbidden: Cannot move artist to another label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }
    await env2.DB.prepare("UPDATE artists SET name = ?, label_id = ?, type = ?, spotify_id = ?, apple_music_id = ?, instagram_url = ?, facebook_url = ?, email = ? WHERE id = ?").bind(name, labelId, type, spotifyId, appleMusicId, instagramUrl, data.facebookUrl || null, email, id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "DELETE" && id) {
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      const userLabelId = await getUserLabelId(env2, currentUser);
      const artist = await env2.DB.prepare("SELECT label_id FROM artists WHERE id = ?").bind(id).first();
      if (!artist) return new Response(null, { status: 404, headers: corsHeaders });
      const isAuthorized = await env2.DB.prepare(`
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT 1 FROM sub_labels WHERE id = ?
            `).bind(userLabelId, artist.label_id).first();
      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: "Forbidden: Cannot delete artist for another label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    const usedIn = await env2.DB.prepare(`
            SELECT id FROM releases 
            WHERE (primary_artist_ids LIKE ? OR featured_artist_ids LIKE ?)
            AND status NOT IN ('Draft', 'Takedown')
        `).bind(`%${id}%`, `%${id}%`).first();
    if (usedIn) {
      return new Response(JSON.stringify({ error: "Artist cannot be deleted as they are linked to active or pending releases." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await env2.DB.prepare("DELETE FROM artists WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return new Response(null, { status: 405, headers: corsHeaders });
}
__name(handleArtists, "handleArtists");
async function handleReleases(request, env2, corsHeaders, currentUser) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (request.method === "GET") {
    if (id && id !== "releases") {
      const release2 = await env2.DB.prepare("SELECT * FROM releases WHERE id = ?").bind(id).first();
      if (!release2) return new Response(null, { status: 404, headers: corsHeaders });
      const isStaff2 = currentUser.role === "Owner" || currentUser.role === "Employee";
      if (!isStaff2) {
        const userLabelId = currentUser.labelId;
        if (!userLabelId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const isAuthorized = await env2.DB.prepare(`
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT 1 FROM sub_labels WHERE id = ?
                `).bind(userLabelId, release2.label_id).first();
        if (!isAuthorized) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
      const { results: tracks } = await env2.DB.prepare("SELECT * FROM tracks WHERE release_id = ?").bind(id).all();
      const { results: notes } = await env2.DB.prepare("SELECT * FROM interaction_notes WHERE release_id = ? ORDER BY timestamp DESC").bind(id).all();
      const artistIds = /* @__PURE__ */ new Set([
        ...JSON.parse(release2.primary_artist_ids || "[]"),
        ...JSON.parse(release2.featured_artist_ids || "[]"),
        ...tracks.flatMap((t) => [
          ...JSON.parse(t.primary_artist_ids || "[]"),
          ...JSON.parse(t.featured_artist_ids || "[]")
        ])
      ]);
      const artists = [];
      if (artistIds.size > 0) {
        const ids = Array.from(artistIds);
        const placeholders = ids.map(() => "?").join(",");
        const { results: results2 } = await env2.DB.prepare(`SELECT * FROM artists WHERE id IN (${placeholders})`).bind(...ids).all();
        artists.push(...results2);
      }
      const mapped = mapRelease(release2);
      mapped.tracks = tracks.map(mapTrack);
      mapped.notes = notes.map(mapNote);
      mapped.artists = artists.map(mapArtist);
      return new Response(JSON.stringify(mapped), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let query = "SELECT * FROM releases";
    let params = [];
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      const userLabelId = currentUser.labelId;
      if (userLabelId) {
        query = `
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT * FROM releases WHERE label_id IN (SELECT id FROM sub_labels)
                `;
        params = [userLabelId];
      } else {
        return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    const { results } = await env2.DB.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(results.map(mapRelease)), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "POST") {
    const data = await request.json();
    const newId = crypto.randomUUID();
    const batch = [];
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      const userLabelId = await getUserLabelId(env2, currentUser);
      if (data.labelId !== userLabelId) {
        const isAuthorized = await env2.DB.prepare(`
                    WITH RECURSIVE sub_labels AS (
                        SELECT id FROM labels WHERE id = ?
                        UNION ALL
                        SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                    )
                    SELECT 1 FROM sub_labels WHERE id = ?
                `).bind(userLabelId, data.labelId).first();
        if (!isAuthorized) {
          return new Response(JSON.stringify({ error: "Forbidden: Cannot create release for another label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }
    }
    batch.push(env2.DB.prepare(`
            INSERT INTO releases (
                id, title, version_title, release_type, content_type, primary_artist_ids, featured_artist_ids, label_id, 
                upc, catalogue_number, release_date, status, artwork_url, artwork_file_name, 
                p_line, c_line, explicit, genre, sub_genre, mood, language, 
                publisher, film_name, film_director, film_producer, film_banner, film_cast, 
                original_release_date, youtube_content_id,
                label_ipi, label_iprs, description, time_of_music_release, date_of_expiry,
                apple_producer_id, apple_director_id, apple_starcast_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
      newId,
      data.title || "Untitled Release",
      data.versionTitle || null,
      data.releaseType || null,
      data.contentType || null,
      JSON.stringify(data.primaryArtistIds || []),
      JSON.stringify(data.featuredArtistIds || []),
      data.labelId || null,
      data.upc || null,
      data.catalogueNumber || null,
      data.releaseDate || null,
      data.status || "Draft",
      data.artworkUrl || null,
      data.artworkFileName || null,
      data.pLine || null,
      data.cLine || null,
      data.explicit ? 1 : 0,
      data.genre || null,
      data.subGenre || null,
      data.mood || null,
      data.language || null,
      data.publisher || null,
      data.filmName || null,
      data.filmDirector || null,
      data.filmProducer || null,
      data.filmBanner || null,
      data.filmCast || null,
      data.originalReleaseDate || null,
      data.youtubeContentId ? 1 : 0,
      data.labelIpi || null,
      data.labelIprs || null,
      data.description || null,
      data.timeOfMusicRelease || null,
      data.dateOfExpiry || null,
      data.appleProducerId || null,
      data.appleDirectorId || null,
      data.appleStarcastId || null
    ));
    if (data.tracks && Array.isArray(data.tracks)) {
      for (const track of data.tracks) {
        batch.push(env2.DB.prepare(`
                    INSERT INTO tracks (
                        id, release_id, track_number, disc_number, title, version_title, 
                        primary_artist_ids, featured_artist_ids, isrc, duration, explicit, 
                        audio_file_name, audio_url, dolby_isrc, 
                        composer, lyricist, language, content_type, crbt_title, crbt_duration,
                        remixer_name, composer_ipi, lyricist_ipi, composer_iprs, lyricist_iprs,
                        is_instrumental, apple_remixer_id, apple_composer_id, apple_lyricist_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
          crypto.randomUUID(),
          newId,
          track.trackNumber || 0,
          track.discNumber || 1,
          track.title || "Untitled Track",
          track.versionTitle || null,
          JSON.stringify(track.primaryArtistIds || []),
          JSON.stringify(track.featuredArtistIds || []),
          track.isrc || null,
          track.duration || 0,
          track.explicit ? 1 : 0,
          track.audioFileName || null,
          track.audioUrl || null,
          track.dolbyIsrc || null,
          track.composer || null,
          track.lyricist || null,
          track.language || null,
          track.contentType || "Music",
          track.crbtTitle || null,
          track.crbtDuration || null,
          track.remixerName || null,
          track.composerIpi || null,
          track.lyricistIpi || null,
          track.composerIprs || null,
          track.lyricistIprs || null,
          track.isInstrumental || null,
          track.appleRemixerId || null,
          track.appleComposerId || null,
          track.appleLyricistId || null
        ));
      }
    }
    await env2.DB.batch(batch);
    return new Response(JSON.stringify({ id: newId, ...data }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "PUT" && id) {
    const data = await request.json();
    const current = await env2.DB.prepare("SELECT * FROM releases WHERE id = ?").bind(id).first();
    if (!current) return new Response(null, { status: 404, headers: corsHeaders });
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    if (!isStaff) {
      const userLabelId = await getUserLabelId(env2, currentUser);
      const isAuthorized = await env2.DB.prepare(`
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT 1 FROM sub_labels WHERE id = ?
            `).bind(userLabelId, current.label_id).first();
      if (!isAuthorized) {
        return new Response(JSON.stringify({ error: "Forbidden: Cannot update release for another label" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
    const batch = [];
    if (data.status === "Rejected" || data.status === "Takedown") {
      if (env2.BUCKET) {
        try {
          const { results: tracks } = await env2.DB.prepare("SELECT audio_url FROM tracks WHERE release_id = ?").bind(id).all();
          const folderName = extractFolderName(id, current.artwork_url, tracks);
          await deleteR2Folder(env2.BUCKET, `releases/${folderName}/audio/`);
          await deleteR2Folder(env2.BUCKET, `releases/${folderName}/artwork/`);
          console.log(`\u2705 Purged assets from: releases/${folderName}/`);
        } catch (e) {
          console.error("Asset purge failed:", e.message);
        }
      }
      batch.push(env2.DB.prepare("UPDATE tracks SET audio_url = NULL, audio_file_name = NULL WHERE release_id = ?").bind(id));
      batch.push(env2.DB.prepare("UPDATE releases SET artwork_url = NULL, artwork_file_name = NULL WHERE id = ?").bind(id));
    }
    batch.push(env2.DB.prepare(`
            UPDATE releases SET 
                title = ?, version_title = ?, release_type = ?, content_type = ?, primary_artist_ids = ?, featured_artist_ids = ?, 
                upc = ?, catalogue_number = ?, release_date = ?, status = ?, artwork_url = ?, artwork_file_name = ?, 
                p_line = ?, c_line = ?, explicit = ?, genre = ?, sub_genre = ?, mood = ?, language = ?, 
                publisher = ?, film_name = ?, film_director = ?, film_producer = ?, film_banner = ?, film_cast = ?, 
                original_release_date = ?, youtube_content_id = ?, 
                label_ipi = ?, label_iprs = ?, description = ?, time_of_music_release = ?, date_of_expiry = ?,
                apple_producer_id = ?, apple_director_id = ?, apple_starcast_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(
      data.title ?? current.title,
      data.versionTitle ?? current.version_title,
      data.releaseType ?? current.release_type,
      data.contentType ?? current.content_type,
      data.primaryArtistIds ? JSON.stringify(data.primaryArtistIds) : current.primary_artist_ids,
      data.featuredArtistIds ? JSON.stringify(data.featuredArtistIds) : current.featured_artist_ids,
      data.upc ?? current.upc,
      data.catalogueNumber ?? current.catalogue_number,
      data.releaseDate ?? current.release_date,
      data.status ?? current.status,
      data.artworkUrl ?? current.artwork_url,
      data.artworkFileName ?? current.artwork_file_name,
      data.pLine ?? current.p_line,
      data.cLine ?? current.c_line,
      data.explicit !== void 0 ? data.explicit ? 1 : 0 : current.explicit,
      data.genre ?? current.genre,
      data.subGenre ?? current.sub_genre,
      data.mood ?? current.mood,
      data.language ?? current.language,
      data.publisher ?? current.publisher,
      data.filmName ?? current.film_name,
      data.filmDirector ?? current.film_director,
      data.filmProducer ?? current.film_producer,
      data.filmBanner ?? current.film_banner,
      data.filmCast ?? current.film_cast,
      data.originalReleaseDate ?? current.original_release_date,
      data.youtubeContentId !== void 0 ? data.youtubeContentId ? 1 : 0 : current.youtube_content_id,
      data.labelIpi ?? current.label_ipi,
      data.labelIprs ?? current.label_iprs,
      data.description ?? current.description,
      data.timeOfMusicRelease ?? current.time_of_music_release,
      data.dateOfExpiry ?? current.date_of_expiry,
      data.appleProducerId ?? current.apple_producer_id,
      data.appleDirectorId ?? current.apple_director_id,
      data.appleStarcastId ?? current.apple_starcast_id,
      id
    ));
    if (data.tracks !== void 0 && Array.isArray(data.tracks)) {
      batch.push(env2.DB.prepare("DELETE FROM tracks WHERE release_id = ?").bind(id));
      for (const track of data.tracks) {
        batch.push(env2.DB.prepare(`
                    INSERT INTO tracks (
                        id, release_id, track_number, disc_number, title, version_title, 
                        primary_artist_ids, featured_artist_ids, isrc, duration, explicit, 
                        audio_file_name, audio_url, dolby_isrc, 
                        composer, lyricist, language, content_type, crbt_title, crbt_duration,
                        remixer_name, composer_ipi, lyricist_ipi, composer_iprs, lyricist_iprs,
                        is_instrumental, apple_remixer_id, apple_composer_id, apple_lyricist_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
          track.id || crypto.randomUUID(),
          id,
          track.trackNumber || 0,
          track.discNumber || 1,
          track.title || "Untitled Track",
          track.versionTitle || null,
          JSON.stringify(track.primaryArtistIds || []),
          JSON.stringify(track.featuredArtistIds || []),
          track.isrc || null,
          track.duration || 0,
          track.explicit ? 1 : 0,
          track.audioFileName || null,
          track.audioUrl || null,
          track.dolbyIsrc || null,
          track.composer || null,
          track.lyricist || null,
          track.language || null,
          track.contentType || "Music",
          track.crbtTitle || null,
          track.crbtDuration || null,
          track.remixerName || null,
          track.composerIpi || null,
          track.lyricistIpi || null,
          track.composerIprs || null,
          track.lyricistIprs || null,
          track.isInstrumental || null,
          track.appleRemixerId || null,
          track.appleComposerId || null,
          track.appleLyricistId || null
        ));
      }
    }
    if (data.notes && data.notes.length > 0) {
      const note = data.notes[0];
      batch.push(env2.DB.prepare("INSERT INTO interaction_notes (id, release_id, author_name, author_role, message) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, note.authorName || "System", note.authorRole || "Staff", note.message));
      if (data.status === "Needs Info") {
        try {
          const labelInfo = await env2.DB.prepare(`
                        SELECT u.email 
                        FROM labels l 
                        JOIN users u ON l.owner_id = u.id 
                        WHERE l.id = ?
                    `).bind(current.label_id).first();
          if (labelInfo && labelInfo.email) {
            const { subject, html: htmlBody, text: textBody } = getCorrectionEmail(current.title, current.upc, current.created_at, note.message, id);
            await sendZeptoEmail(env2, labelInfo.email, subject, htmlBody, textBody);
          }
        } catch (e) {
          console.error("Correction email failed:", e);
        }
      }
    }
    if (data.status === "Published" && current.status !== "Published") {
      try {
        const labelInfo = await env2.DB.prepare(`
                    SELECT l.name as label_name, u.email
                    FROM labels l 
                    JOIN users u ON l.owner_id = u.id 
                    WHERE l.id = ?
                `).bind(current.label_id).first();
        if (labelInfo) {
          const releaseTitle = data.title || current.title;
          const upc = data.upc || current.upc || "Pending";
          const releaseDate = data.releaseDate || current.release_date || "TBA";
          const labelName = labelInfo.label_name;
          const { subject, html: htmlBody, text: textBody } = getPublicationEmail(releaseTitle, upc, releaseDate, labelName, id);
          const { results: admins } = await env2.DB.prepare("SELECT email FROM users WHERE label_id = ? AND role IN ('Label Admin', 'Sub-Label Admin')").bind(current.label_id).all();
          const recipientEmails = admins.map((a) => a.email);
          if (labelInfo.email && !recipientEmails.includes(labelInfo.email)) {
            recipientEmails.push(labelInfo.email);
          }
          for (const email of recipientEmails) {
            try {
              await sendZeptoEmail(env2, email, subject, htmlBody, textBody);
            } catch (err) {
              console.error(`Failed to send publication email to ${email}:`, err);
            }
          }
        }
      } catch (e) {
        console.error("Publication email failed:", e);
      }
    }
    await env2.DB.batch(batch);
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "DELETE" && id) {
    const release2 = await env2.DB.prepare(`
            SELECT r.status, r.label_id, r.artwork_url, l.parent_label_id 
            FROM releases r
            LEFT JOIN labels l ON r.label_id = l.id
            WHERE r.id = ?
        `).bind(id).first();
    if (!release2) return new Response(null, { status: 404, headers: corsHeaders });
    const isStaff = currentUser.role === "Owner" || currentUser.role === "Employee";
    const isDeletableStatus = release2.status === "Draft" || release2.status === "Needs Info";
    let userLabelId = currentUser.labelId;
    if (!userLabelId && !isStaff) {
      const userRecord = await env2.DB.prepare("SELECT label_id FROM users WHERE id = ?").bind(currentUser.sub).first();
      userLabelId = userRecord?.label_id;
    }
    const isOwnerLabel = release2.label_id === userLabelId;
    const isParentLabel = release2.parent_label_id === userLabelId;
    if (isStaff || isDeletableStatus && (isOwnerLabel || isParentLabel)) {
      if (env2.BUCKET) {
        try {
          const { results: tracks } = await env2.DB.prepare("SELECT audio_url FROM tracks WHERE release_id = ?").bind(id).all();
          const folderName = extractFolderName(id, release2.artwork_url, tracks);
          const prefix = `releases/${folderName}/`;
          await deleteR2Folder(env2.BUCKET, prefix);
          console.log(`\u2705 Deleted R2 folder: ${prefix}`);
        } catch (e) {
          console.error("R2 deletion failed:", e.message);
        }
      }
      await env2.DB.prepare("DELETE FROM releases WHERE id = ?").bind(id).run();
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    return new Response(JSON.stringify({ error: "Unauthorized or invalid status" }), { status: 403, headers: corsHeaders });
  }
  return new Response(null, { status: 405, headers: corsHeaders });
}
__name(handleReleases, "handleReleases");
async function handleNotices(request, env2, corsHeaders, currentUser) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (request.method === "GET") {
    const { results } = await env2.DB.prepare("SELECT * FROM notices ORDER BY timestamp DESC").all();
    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "POST") {
    const data = await request.json();
    const newId = crypto.randomUUID();
    await env2.DB.prepare("INSERT INTO notices (id, title, message, type, author_id, author_name, author_designation, target_audience) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(newId, sanitize(data.title), sanitize(data.message), sanitize(data.type), currentUser.sub, sanitize(currentUser.name || "Admin"), sanitize(currentUser.designation || "Staff"), sanitize(data.targetAudience)).run();
    return new Response(JSON.stringify({ id: newId, ...data }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "PUT" && id) {
    const data = await request.json();
    await env2.DB.prepare("UPDATE notices SET title = ?, message = ?, type = ?, target_audience = ? WHERE id = ?").bind(sanitize(data.title), sanitize(data.message), sanitize(data.type), sanitize(data.targetAudience), id).run();
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (request.method === "DELETE" && id) {
    await env2.DB.prepare("DELETE FROM notices WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return new Response(null, { status: 405, headers: corsHeaders });
}
__name(handleNotices, "handleNotices");
async function handleRevenue(request, env2, corsHeaders) {
  if (request.method === "GET") {
    const { results } = await env2.DB.prepare("SELECT * FROM revenue_entries").all();
    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return new Response(null, { status: 405, headers: corsHeaders });
}
__name(handleRevenue, "handleRevenue");
async function handleSearch(request, env2, corsHeaders) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const searchPattern = `%${query}%`;
  const { results: users } = await env2.DB.prepare("SELECT * FROM users WHERE name LIKE ? OR email LIKE ?").bind(searchPattern, searchPattern).all();
  const { results: releases } = await env2.DB.prepare(`
        SELECT DISTINCT r.* 
        FROM releases r
        LEFT JOIN tracks t ON r.id = t.release_id
        WHERE r.title LIKE ? 
        OR r.upc LIKE ? 
        OR t.isrc LIKE ?
    `).bind(searchPattern, searchPattern, searchPattern).all();
  const { results: artists } = await env2.DB.prepare("SELECT * FROM artists WHERE name LIKE ?").bind(searchPattern).all();
  const { results: labels } = await env2.DB.prepare("SELECT * FROM labels WHERE name LIKE ?").bind(searchPattern).all();
  return new Response(JSON.stringify({
    users: (users || []).map(mapUser),
    releases: (releases || []).map(mapRelease),
    artists: (artists || []).map(mapArtist),
    labels: (labels || []).map(mapLabel)
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
__name(handleSearch, "handleSearch");
async function handleStats(request, env2, corsHeaders) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    const labelId = url.searchParams.get("labelId");
    let artistsQuery, labelsQuery, releasesQuery;
    const params = [];
    if (labelId) {
      params.push(labelId);
      artistsQuery = `
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT COUNT(*) as count FROM artists WHERE label_id IN (SELECT id FROM sub_labels)
            `;
      labelsQuery = `
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT COUNT(*) as count FROM labels WHERE parent_label_id IN (SELECT id FROM sub_labels)
            `;
      releasesQuery = `
                WITH RECURSIVE sub_labels AS (
                    SELECT id FROM labels WHERE id = ?
                    UNION ALL
                    SELECT l.id FROM labels l JOIN sub_labels sl ON l.parent_label_id = sl.id
                )
                SELECT 
                    COUNT(CASE WHEN status = 'Draft' THEN 1 END) as drafted,
                    COUNT(CASE WHEN status = 'Published' THEN 1 END) as published,
                    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected,
                    COUNT(CASE WHEN status = 'Needs Info' THEN 1 END) as correction,
                    COUNT(CASE WHEN status = 'Takedown' THEN 1 END) as takedown,
                    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending
                FROM releases
                WHERE label_id IN (SELECT id FROM sub_labels)
            `;
    } else {
      artistsQuery = "SELECT COUNT(*) as count FROM artists";
      labelsQuery = "SELECT COUNT(*) as count FROM labels";
      releasesQuery = `
                SELECT 
                    COUNT(CASE WHEN status = 'Draft' THEN 1 END) as drafted,
                    COUNT(CASE WHEN status = 'Published' THEN 1 END) as published,
                    COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected,
                    COUNT(CASE WHEN status = 'Needs Info' THEN 1 END) as correction,
                    COUNT(CASE WHEN status = 'Takedown' THEN 1 END) as takedown,
                    COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending
                FROM releases
            `;
    }
    const artists = await env2.DB.prepare(artistsQuery).bind(...params).first();
    const labels = await env2.DB.prepare(labelsQuery).bind(...params).first();
    const releaseStats = await env2.DB.prepare(releasesQuery).bind(...params).first();
    return new Response(JSON.stringify({
      artists: artists?.count || 0,
      labels: labels?.count || 0,
      drafted: releaseStats?.drafted || 0,
      published: releaseStats?.published || 0,
      rejected: releaseStats?.rejected || 0,
      correction: releaseStats?.correction || 0,
      takedown: releaseStats?.takedown || 0,
      pending: releaseStats?.pending || 0
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  return new Response(null, { status: 405, headers: corsHeaders });
}
__name(handleStats, "handleStats");
function sanitize(val) {
  return val === void 0 ? null : val;
}
__name(sanitize, "sanitize");
function mapUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    designation: u.designation,
    labelId: u.label_id,
    labelName: u.label_name,
    artistId: u.artist_id,
    artistName: u.artist_name,
    permissions: JSON.parse(u.permissions || "{}"),
    isBlocked: !!u.is_blocked,
    blockReason: u.block_reason,
    password_hash: u.password_hash
    // Keep for internal check
  };
}
__name(mapUser, "mapUser");
function mapLabel(l) {
  if (!l) return null;
  return {
    id: l.id,
    name: l.name,
    parentLabelId: l.parent_label_id,
    ownerId: l.owner_id,
    address: l.address,
    city: l.city,
    country: l.country,
    taxId: l.tax_id,
    website: l.website,
    phone: l.phone,
    revenueShare: l.revenue_share,
    maxArtists: l.max_artists,
    status: l.status,
    createdAt: l.created_at,
    ownerEmail: l.owner_email
  };
}
__name(mapLabel, "mapLabel");
function mapArtist(a) {
  if (!a) return null;
  return {
    id: a.id,
    name: a.name,
    labelId: a.label_id,
    type: a.type,
    spotifyId: a.spotify_id,
    appleMusicId: a.apple_music_id,
    instagramUrl: a.instagram_url,
    facebookUrl: a.facebook_url,
    email: a.email,
    createdAt: a.created_at
  };
}
__name(mapArtist, "mapArtist");
function mapNote(n) {
  if (!n) return null;
  return {
    id: n.id,
    releaseId: n.release_id,
    authorName: n.author_name,
    authorRole: n.author_role,
    message: n.message,
    timestamp: n.timestamp
  };
}
__name(mapNote, "mapNote");
function mapTrack(t) {
  if (!t) return null;
  return {
    id: t.id,
    releaseId: t.release_id,
    trackNumber: t.track_number,
    discNumber: t.disc_number,
    title: t.title,
    versionTitle: t.version_title,
    primaryArtistIds: JSON.parse(t.primary_artist_ids || "[]"),
    featuredArtistIds: JSON.parse(t.featured_artist_ids || "[]"),
    isrc: t.isrc,
    duration: t.duration,
    explicit: !!t.explicit,
    audioFileName: t.audio_file_name,
    audioUrl: t.audio_url,
    dolbyIsrc: t.dolby_isrc,
    composer: t.composer,
    lyricist: t.lyricist,
    language: t.language,
    contentType: t.content_type,
    crbtTitle: t.crbt_title,
    crbtDuration: t.crbt_duration,
    remixerName: t.remixer_name,
    composerIpi: t.composer_ipi,
    lyricistIpi: t.lyricist_ipi,
    composerIprs: t.composer_iprs,
    lyricistIprs: t.lyricist_iprs,
    isInstrumental: t.is_instrumental,
    appleRemixerId: t.apple_remixer_id,
    appleComposerId: t.apple_composer_id,
    appleLyricistId: t.apple_lyricist_id,
    createdAt: t.created_at
  };
}
__name(mapTrack, "mapTrack");
function mapRelease(r) {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    versionTitle: r.version_title,
    releaseType: r.release_type,
    contentType: r.content_type,
    primaryArtistIds: JSON.parse(r.primary_artist_ids || "[]"),
    featuredArtistIds: JSON.parse(r.featured_artist_ids || "[]"),
    labelId: r.label_id,
    upc: r.upc,
    catalogueNumber: r.catalogue_number,
    releaseDate: r.release_date,
    status: r.status,
    artworkUrl: r.artwork_url,
    artworkFileName: r.artwork_file_name,
    pLine: r.p_line,
    cLine: r.c_line,
    explicit: !!r.explicit,
    genre: r.genre,
    subGenre: r.sub_genre,
    mood: r.mood,
    language: r.language,
    publisher: r.publisher,
    filmName: r.film_name,
    filmDirector: r.film_director,
    filmProducer: r.film_producer,
    filmBanner: r.film_banner,
    filmCast: r.film_cast,
    originalReleaseDate: r.original_release_date,
    youtubeContentId: !!r.youtube_content_id,
    labelIpi: r.label_ipi,
    labelIprs: r.label_iprs,
    description: r.description,
    timeOfMusicRelease: r.time_of_music_release,
    dateOfExpiry: r.date_of_expiry,
    appleProducerId: r.apple_producer_id,
    appleDirectorId: r.apple_director_id,
    appleStarcastId: r.apple_starcast_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}
__name(mapRelease, "mapRelease");
async function verifyTurnstile(token, secret) {
  if (!token) return { success: false };
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    body: formData,
    method: "POST"
  });
  return await result.json();
}
__name(verifyTurnstile, "verifyTurnstile");
async function authenticate(request, env2) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const payload = await verifyJwt(token, env2.JWT_SECRET);
    if (payload && payload.sub) {
      const user = await env2.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.sub).first();
      if (user) {
        return {
          ...payload,
          role: user.role,
          permissions: JSON.parse(user.permissions || "{}"),
          labelId: user.label_id
        };
      }
    }
    return payload;
  } catch (e) {
    return null;
  }
}
__name(authenticate, "authenticate");
async function requireAdmin(request, env2, corsHeaders) {
  const user = await authenticate(request, env2);
  if (!user) {
    return { error: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  const isAdmin = user.role === "Owner" || user.role === "Employee";
  if (!isAdmin) {
    return { error: new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  return { user };
}
__name(requireAdmin, "requireAdmin");
async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, "");
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}
__name(signJwt, "signJwt");
async function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signature = Uint8Array.from(atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  if (!isValid) throw new Error("Invalid signature");
  return JSON.parse(atob(encodedPayload));
}
__name(verifyJwt, "verifyJwt");
async function deleteR2Folder(bucket, prefix) {
  let truncated = true;
  let cursor;
  while (truncated) {
    const list = await bucket.list({ prefix, cursor });
    if (list.objects.length > 0) {
      await bucket.delete(list.objects.map((o) => o.key));
    }
    truncated = list.truncated;
    cursor = list.truncated ? list.cursor : void 0;
  }
}
__name(deleteR2Folder, "deleteR2Folder");
function extractFolderName(id, artworkUrl, tracks) {
  const urls = [artworkUrl, ...(tracks || []).map((t) => t.audio_url)].filter(Boolean);
  for (const url of urls) {
    const parts = url.split("/");
    const relIdx = parts.indexOf("releases");
    if (relIdx !== -1 && parts[relIdx + 1]) return parts[relIdx + 1];
  }
  return id;
}
__name(extractFolderName, "extractFolderName");
async function handleExportReleases(request, env2, corsHeaders) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const status = url.searchParams.get("status");
  let query = "SELECT * FROM releases";
  const conditions = [];
  let params = [];
  if (startDate) {
    conditions.push("created_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("created_at <= ?");
    params.push(endDate + " 23:59:59");
  }
  if (status && status !== "ALL") {
    conditions.push("status = ?");
    params.push(status);
  }
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  const { results: releases } = await env2.DB.prepare(query).bind(...params).all();
  if (releases.length === 0) {
    return new Response(JSON.stringify([]), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const releaseIds = releases.map((r) => r.id);
  let tracksQuery = "SELECT * FROM tracks WHERE release_id IN (SELECT id FROM releases";
  if (conditions.length > 0) {
    tracksQuery += " WHERE " + conditions.join(" AND ");
  }
  tracksQuery += ")";
  const { results: tracks } = await env2.DB.prepare(tracksQuery).bind(...params).all();
  const tracksByRelease = /* @__PURE__ */ new Map();
  tracks.forEach((t) => {
    if (!tracksByRelease.has(t.release_id)) tracksByRelease.set(t.release_id, []);
    tracksByRelease.get(t.release_id).push(mapTrack(t));
  });
  const mappedReleases = releases.map((r) => {
    const mapped = mapRelease(r);
    mapped.tracks = tracksByRelease.get(r.id) || [];
    return mapped;
  });
  return new Response(JSON.stringify(mappedReleases), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
__name(handleExportReleases, "handleExportReleases");

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-pkqYVM/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = worker_default;

// C:/Users/USER/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-pkqYVM/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

// Re-exports
export * from './events';
export * from './exceptions';

// Classes
export {ComponentEvents, ComponentFlags, Component} from '@ambreia/kernel/runtime/Component';
export {ComponentContext} from '@ambreia/kernel/runtime/ComponentContext';
export {ComponentDependency} from '@ambreia/kernel/runtime/ComponentDependency';
export {CoreComponentContext, CoreComponentContextEvents, CoreSetup} from '@ambreia/kernel/runtime/CoreComponentContext';
export {DefaultErrorReporter} from '@ambreia/kernel/runtime/DefaultErrorReporter';
export {createIID, getIIDName} from '@ambreia/kernel/runtime/IID';

// Types
export type {IDependencyEventListener} from '@ambreia/kernel/runtime/ComponentDependency';
export type {InterfaceCallback, IContext, IUpdateReceiver} from '@ambreia/kernel/runtime/IContext';
export type {ICore} from '@ambreia/kernel/runtime/ICore';
export type {ICoreConfiguration} from '@ambreia/kernel/runtime/ICoreConfiguration';
export type {ICoreErrorLogger} from '@ambreia/kernel/runtime/ICoreErrorLogger';
export type {ICoreErrorReporter} from '@ambreia/kernel/runtime/ICoreErrorReporter';
export type {IDisposable} from '@ambreia/common/IDisposable';
export type {IFileProxy} from '@ambreia/kernel/runtime/IFileProxy';
export type {IID} from '@ambreia/kernel/runtime/IID';

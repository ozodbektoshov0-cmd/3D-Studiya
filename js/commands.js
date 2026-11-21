/* ---- Buyruqlar (Command Pattern) menejeri: Undo / Redo boshqaruvi ---- */
(function(rootScope){
'use strict';

class Command{
 constructor(opts){
  if(!opts||typeof opts.undo!=='function'||typeof (opts.redo||opts.execute)!=='function'){
   throw new Error('Command uchun execute/redo va undo funksiyalari kerak');
  }
  this.label=String(opts.label||'Amal');
  this._execute=opts.execute||opts.redo;
  this._redo=opts.redo||opts.execute;
  this._undo=opts.undo;
  this.timestamp=Date.now();
 }
 execute(){return this._execute()}
 redo(){return this._redo()}
 undo(){return this._undo()}
}

class MacroCommand extends Command{
 constructor(label,commands){
  const list=(commands||[]).slice();
  super({
   label:label||'Guruh amali',
   execute:()=>{for(let i=0;i<list.length;i++)list[i].execute()},
   redo:()=>{for(let i=0;i<list.length;i++)list[i].redo()},
   undo:()=>{for(let i=list.length-1;i>=0;i--)list[i].undo()}
  });
  this.commands=list;
 }
}

class CommandManager{
 constructor(opts){
  this.undoStack=[];
  this.redoStack=[];
  this.maxHistory=(opts&&opts.maxHistory)||200;
  this._batch=null;
  this._listeners=new Set();
  this._onApply=(opts&&opts.onApply)||null;
 }
 setLimit(n){
  const v=Math.max(1,Math.min(1000,+n||200));
  this.maxHistory=v;
  if(this.undoStack.length>v)this.undoStack.splice(0,this.undoStack.length-v);
  this._emit();
 }
 onChange(fn){
  if(typeof fn==='function')this._listeners.add(fn);
  return()=>this._listeners.delete(fn);
 }
 _emit(){
  const state={
   canUndo:this.canUndo(),
   canRedo:this.canRedo(),
   undoLabel:this.undoLabel(),
   redoLabel:this.redoLabel(),
   undoCount:this.undoStack.length,
   redoCount:this.redoStack.length
  };
  this._listeners.forEach(fn=>{try{fn(state)}catch(e){}});
 }
 _push(cmd){
  if(this._batch){this._batch.items.push(cmd);return cmd}
  this.undoStack.push(cmd);
  if(this.undoStack.length>this.maxHistory){
   this.undoStack.splice(0,this.undoStack.length-this.maxHistory);
  }
  this.redoStack.length=0;
  this._emit();
  return cmd;
 }
 /* Yangi buyruqni bajaradi va tarixga yozadi */
 execute(cmdOrOpts){
  const cmd=cmdOrOpts instanceof Command?cmdOrOpts:new Command(cmdOrOpts);
  cmd.execute();
  this._push(cmd);
  if(this._onApply)this._onApply('execute',cmd);
  return cmd;
 }
 /* Allaqachon bajarilgan amal uchun teskari/qayta funksiyalarni ro’yxatga oladi (eski hist() ko’prigi) */
 register(undoFn,redoFn,label){
  const cmd=new Command({label:label||'Amal',undo:undoFn,redo:redoFn,execute:redoFn});
  this._push(cmd);
  return cmd;
 }
 beginBatch(label){
  if(this._batch)return false;
  this._batch={label:String(label||'Guruh amali'),items:[]};
  return true;
 }
 endBatch(){
  if(!this._batch)return null;
  const b=this._batch;
  this._batch=null;
  if(!b.items.length)return null;
  const cmd=b.items.length===1?b.items[0]:new MacroCommand(b.label,b.items);
  this._push(cmd);
  return cmd;
 }
 batch(label,fn){
  this.beginBatch(label);
  try{
   const res=fn();
   this.endBatch();
   return res;
  }catch(e){
   this._batch=null;
   throw e;
  }
 }
 canUndo(){return this.undoStack.length>0}
 canRedo(){return this.redoStack.length>0}
 undoLabel(){const c=this.undoStack[this.undoStack.length-1];return c?c.label:''}
 redoLabel(){const c=this.redoStack[this.redoStack.length-1];return c?c.label:''}
 undo(){
  const cmd=this.undoStack.pop();
  if(!cmd)return null;
  cmd.undo();
  this.redoStack.push(cmd);
  this._emit();
  if(this._onApply)this._onApply('undo',cmd);
  return cmd;
 }
 redo(){
  const cmd=this.redoStack.pop();
  if(!cmd)return null;
  cmd.redo();
  this.undoStack.push(cmd);
  this._emit();
  if(this._onApply)this._onApply('redo',cmd);
  return cmd;
 }
 clear(){
  this.undoStack.length=0;
  this.redoStack.length=0;
  this._batch=null;
  this._emit();
 }
 getHistory(){
  return{
   undo:this.undoStack.map(c=>c.label),
   redo:this.redoStack.map(c=>c.label)
  };
 }
}

const mgr=new CommandManager({
 onApply:(kind)=>{
  if(kind==='undo'||kind==='redo'){
   if(typeof rootScope.refresh==='function')rootScope.refresh();
   else if(typeof refresh==='function')refresh();
  }
 }
});

const api={
 Command,
 MacroCommand,
 CommandManager,
 manager:mgr,
 execute:(c)=>mgr.execute(c),
 register:(u,r,l)=>mgr.register(u,r,l),
 undo:()=>mgr.undo(),
 redo:()=>mgr.redo(),
 canUndo:()=>mgr.canUndo(),
 canRedo:()=>mgr.canRedo(),
 undoLabel:()=>mgr.undoLabel(),
 redoLabel:()=>mgr.redoLabel(),
 beginBatch:(l)=>mgr.beginBatch(l),
 endBatch:()=>mgr.endBatch(),
 batch:(l,fn)=>mgr.batch(l,fn),
 setLimit:(n)=>mgr.setLimit(n),
 clear:()=>mgr.clear(),
 getHistory:()=>mgr.getHistory(),
 onChange:(fn)=>mgr.onChange(fn),
 undoStack:mgr.undoStack,
 redoStack:mgr.redoStack
};

if(typeof rootScope!=='undefined')rootScope.CMD=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

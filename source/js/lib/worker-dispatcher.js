export class WorkerDispatcher {
	constructor(worker){
		this.worker = worker;
		this.listeners = new Map();
		this.id = 0;

		this.worker.addEventListener("message", e => {
			const id = e.data.id;

			if(e.data.name === "result"){
				const listener = this.listeners.get(id);
				listener(e.data.result);
				this.listeners.delete(id);
			}
		})
	}
	dispatch(functionName, args){
		const id = this.id;
		this.id++;

		return new Promise((resolve, reject) => {
			this.listeners.set(id, resolve);
			this.worker.postMessage({
				functionName,
				args,
				id
			})
		});
	}
}
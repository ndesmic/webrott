import { renderIndexedBitmap, renderTiledMap } from "../lib/image-utils.js";

function renderTileMap(map, walls, transforms, pallet, tileSize){
	const renderedWalls = walls.map(w => renderIndexedBitmap(w, pallet, true));
	return renderTiledMap(map, renderedWalls, transforms, tileSize);
}

self.onmessage = e => {
	switch(e.data.functionName){
		case "renderIndexedBitmap": {
			const indexedBitmap = renderIndexedBitmap(e.data.args[0], e.data.args[1], true).transferToImageBitmap();
			self.postMessage({
				name: "result",
				id: e.data.id,
				result: indexedBitmap
			}, [indexedBitmap]);
			break;
		}
		case "renderTileMap": {
			const map = renderTileMap(...e.data.args).transferToImageBitmap();
			self.postMessage({
				name: "result",
				id: e.data.id,
				result: map
			}, [map]);
			break;
		}
	}
};
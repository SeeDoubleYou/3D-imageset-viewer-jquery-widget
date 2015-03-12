$(function() {
	var $transversalViewer = $('#transversal').sliceviewer({
		aspect: (600/328),
		imgSlicesPath: 'img/cryo/transversal/',
		imgLabelsPath: "img/labels/transversal/",
		totalNrImages: 910,
		loadNrImages: 50,
		hHairColor: 'rgba( 95, 204,  20, 1)',
		vHairColor: 'rgba(  0,  33, 255, 1)',
		point3DMap: {
			x: 'x',
			y: 'z',
			z: 'y'
		}
	});

	var $saggitalViewer = $('#saggital').sliceviewer({
		aspect: (328/501),
		imgSlicesPath: 'img/cryo/saggital/',
		imgLabelsPath: "img/labels/saggital/",
		totalNrImages: 246,
		loadNrImages: 50,
		hHairColor: 'rgba(255,  68,   0, 1)',
		vHairColor: 'rgba( 95, 204,  20, 1)',
		point3DMap: {
			x: 'z',
			y: 'y',
			z: 'x'
		},
		canvasModifiers: {
			'sepia': false,
			'shift': function(ctx) {
				if(!ctx.canvas)	return;

				var imgData   = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height),
					imgPixels = imgData.data,
					len       = imgPixels.length;

				for (var i=0; i<len; i+=4) {
					var oldr = imgPixels[i];
					imgPixels[i]   += imgPixels[i+1];
					imgPixels[i+1] += imgPixels[i+2];
					imgPixels[i+2] += oldr;
				}

				ctx.putImageData(imgData,0,0);
			}
		}
	});

	var $coronalViewer = $('#coronal').sliceviewer({
		aspect: (600/501),
		imgSlicesPath: 'img/cryo/coronal/',
		imgLabelsPath: "img/labels/coronal/",
		totalNrImages: 134,
		loadNrImages: 50,
		hHairColor: 'rgba(255,  68,   0, 1)',
		vHairColor: 'rgba(  0,  33, 255, 1)',
		point3DMap: {
			x: 'x',
			y: 'y',
			z: 'z'
		}
	});
});
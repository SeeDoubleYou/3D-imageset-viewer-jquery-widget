/**
 * Object that represents a sliceviewer.
 */

(function ( $ ) {

	$.widget('sdy.point3D', { 
		options: {
			point: {
				x: 1,
				y: 1,
				z: 1
			},
			range: {
				x: {
					min: 0,
					max: 1
				},
				y: {
					min: 0,
					max: 1
				},
				z: {
					min: 0,
					max: 1
				}
			}
		},

		_create: function() {
			this.range = jQuery.extend(true, {}, this.options.range);
			this.point = jQuery.extend(true, {}, this.options.point);
			this.previousPoint = jQuery.extend(true, {}, this.options.point);
			this.expanded = false;
		},

		_update: function() {
			var changed = JSON.stringify(this.point) !== JSON.stringify(this.previousPoint);
			if(changed) {
				this._trigger('change');
				this.previousPoint = jQuery.extend(true, {}, this.point);
			}
		},

		_constrainOnAxis: function(axis, value) {
			if(value < this.range[axis].min) value = this.range[axis].min;
			if(value > this.range[axis].max) value = this.range[axis].max;
			return value;
		},

		_constrainPct: function(value) {
			if(value < 0) value = 0;
			if(value > 1) value = 1;
			return value;
		},

		getPercentualValueForAxis: function(axis, value) {
			if(value === undefined)
				value = this.point[axis];
			return this._constrainPct(value / (this.range[axis].max-this.range[axis].min));
		},

		getAbsoluteValueForAxis: function(axis, value) {
			return this._constrainOnAxis(axis, Math.floor(this.range[axis].min + (this.range[axis].max-this.range[axis].min) * value));
		},

		axis: function(axis, value) {
			if ( value === undefined || value === -1 ) {
				return this.point[axis];
			} else {
				this.point[axis] = this._constrainOnAxis(axis, value);
				this._update();
			}
		},

		x: function(value) {
			if(value === undefined) value = -1;
			return this.axis('x', value);
		},

		y: function(value) {
			if(value === undefined) value = -1;
			return this.axis('y', value);
		},

		z: function(value) {
			if(value === undefined) value = -1;
			return this.axis('z', value);
		},

		xyz: function(point) {
			if ( point === undefined ) {
				// No value passed, act as a getter.
				return {
					x: this.x(),
					y: this.y(),
					z: this.z(),
				};
			} else {
				// Value passed, act as a setter.
				this.point = point;
				this._update();
			}
		},
	});

	var $sdyPoint3D = $('<div/>').point3D(); //dummy div
	// console.log($sdyPoint3D);

	$.widget('sdy.sliceviewer', $.sdy.point3D, {

		//default options
		options: {
			imgWidth: 1,
			imgHeight: 1,
			totalNrImages: 1,
			loadNrImages: 1,
			imgSlicesPath: "img/slices/",
			imgLabelsPath: "img/slices/",
			showLabelSlices: true,
			slicesGrayScale: false,
			extension: ".png",
			width: undefined,
			height: undefined,
			slider: undefined,
			looping: false,
			loopSpeed: 1000,
			showPointSelect: true,
			hHairColor: 'rgba(0, 255, 0, 0.6)',
			vHairColor: 'rgba(0, 255, 0, 0.6)',
			hairWidth: 2,
			scrollWheel: true,
			point3D: $sdyPoint3D,
			point3DMap: {
				x: 'x',
				y: 'y',
				z: 'z'
			},
			canvasModifiers: {
				'grayscale': function(ctx) {
					if(!ctx.canvas)	return;
					var imgd = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
					var pix = imgd.data;
					for (var i = 0, n = pix.length; i < n; i += 4) {
						var grayscale = pix[i  ] * .3 + pix[i+1] * .59 + pix[i+2] * .11;
						pix[i  ] = grayscale; 	// red
						pix[i+1] = grayscale; 	// green
						pix[i+2] = grayscale; 	// blue
					// alpha
					}
					ctx.putImageData(imgd, 0, 0);
				},
				'sepia': function(ctx) {
					if(!ctx.canvas)	return;
					var imgd = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
					var d = imgd.data;
					for (var i = 0; i < d.length; i += 4) {
						var r = d[i];
						var g = d[i + 1];
						var b = d[i + 2];
						d[i]     = (r * 0.393)+(g * 0.769)+(b * 0.189); // red
						d[i + 1] = (r * 0.349)+(g * 0.686)+(b * 0.168); // green
						d[i + 2] = (r * 0.272)+(g * 0.534)+(b * 0.131); // blue
					}
					ctx.putImageData(imgd, 0, 0);
				},
				'invert': function(ctx) {
					if(!ctx.canvas)	return;
					var imgData   = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height),
						imgPixels = imgData.data,
						len       = imgPixels.length;
				 
					for (var i=0;i<len;i+=4)
					{
						imgPixels[i]   = 255 - imgPixels[i];
						imgPixels[i+1] = 255 - imgPixels[i+1];
						imgPixels[i+2] = 255 - imgPixels[i+2];
					}

					ctx.putImageData(imgData,0,0);
				},
				'brightness': function(ctx) {
					if(!ctx.canvas)	return;
					var adjustment = 100;
					var imgData   = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height),
						imgPixels = imgData.data,
						len       = imgPixels.length;

					for (var i=0; i<len; i+=4) {
						imgPixels[i]   += adjustment;
						imgPixels[i+1] += adjustment;
						imgPixels[i+2] += adjustment;
					}

					ctx.putImageData(imgData,0,0);
				},
				'threshold': function(ctx) {
					if(!ctx.canvas)	return;
					var threshold = 100;
					var imgData   = ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height),
						imgPixels = imgData.data,
						len       = imgPixels.length;

					for (var i=0; i<len; i+=4) {
						var r = imgPixels[i];
						var g = imgPixels[i+1];
						var b = imgPixels[i+2];
						var v = (0.2126*r + 0.7152*g + 0.0722*b >= threshold) ? 255 : 0;
						imgPixels[i] = imgPixels[i+1] = imgPixels[i+2] = v
					}
					
					ctx.putImageData(imgData,0,0);
				}
			}
		},

		_create: function() {
			this._super();
			var viewer = this; // can't reference 'this' in events of other objects, so user viewer in these cases instead

			// this is set when this sliceviewer updates the point3D. We then ignore the next point3D change event
			this.ignoreNextUpdate = false;

			this.running = false
			this.images = {};
			this.currentSliceImage = new Image();
			this.currentLabelImage = new Image();
			this.previousPoint = {
				x: -1,
				y: -1,
				z: -1
			};

			this.options.point3D.bind("point3Dchange", function(event, data) {
				viewer._setValuesFromPoint3D();
				viewer._update();
			});

			this.wrapper 	= $('<div class="wrapper" />').appendTo(this.element);
			this.container 	= $('<div class="container" />').appendTo(this.wrapper);

			this._updateDimensions();

			this.container.width(this.width);	
			this.container.height(this.height)

			this.range.x.max = this.width;
			this.range.y.max = this.height;
			this.range.z.max = this.options.loadNrImages-1;

			// make sure path has a trailing '/' in the end (add if not present)
			this.options.imgSlicesPath = this.options.imgSlicesPath.replace(/\/?$/, '/');
			this.options.imgLabelsPath = this.options.imgLabelsPath.replace(/\/?$/, '/');

			this.canvas = $('<canvas/>')
				.attr('width', viewer.width)
				.attr('height', viewer.height)
				.appendTo(viewer.container)
			;
			this.canvas2d = this.canvas.get(0).getContext('2d');

			this.controls = $('<div class="slicecontrols">')
				// .width(viewer.width)
				// .height(30)
				.css({
					position: 'absolute',
					bottom: 0,
					left: 0,
					backgroundColor: 'rgba(0,0,0,0.4)',
					display: 'none',
					padding: 5,
					textAlign: 'center',
				})
				.appendTo(viewer.wrapper)
			;

			this.zSlider = $('<div class="zSlider"/>')
				.appendTo(viewer.controls)
				.css({
					width: '80%',
					margin: '0px auto'
				})
				.slider({
					min: viewer.range.z.min,
					max: viewer.range.z.max,
					slide: function( event, ui ) {
						viewer.z(ui.value);
				        viewer._updatePoint3D();
					}
				})
			;

			this.showLabelsCBID = this.element.attr('id') + '_showlabels';
			this.showLabelsCB = $('<input type="checkbox" id="'+this.showLabelsCBID+'" '+(viewer.options.showLabelSlices ? 'checked' : '')+' />').appendTo(viewer.controls);
			$('<label for="'+this.showLabelsCBID+'">label slices</label>').appendTo(viewer.controls);
			this.showLabelsCB
				.appendTo(viewer.controls)
				.button({
					icons: {
			           primary: $(this).prop('checked') ? 'ui-icon-check' : 'ui-icon-radio-on'
			        }
				}).click(function() {
					$(this).button("option", "icons", {
						primary: $(this).prop('checked') ? 'ui-icon-check' : 'ui-icon-radio-on'
					});
					viewer.options.showLabelSlices = $(this).prop('checked');
					viewer._updateCTX();
				})
			;


			// Canvas Modifiers
			jQuery.each(this.options.canvasModifiers, function(modifier, callback) {
				if(!(callback && ({}).toString.call(callback) === '[object Function]'))
					return;
				
				cbid = viewer.element.attr('id') + '_' + modifier;
				$('<label for="'+cbid+'">'+modifier+'</label>').appendTo(viewer.controls);
				$('<input type="checkbox" id="'+cbid+'" '+(viewer.options['cm_'+modifier] ? 'checked' : '')+' />')
					.appendTo(viewer.controls)
					.button({
						icons: {
				           primary: $(this).prop('checked') ? 'ui-icon-check' : 'ui-icon-radio-on'
				        }
					}).click(function() {
						$(this).button("option", "icons", {
							primary: $(this).prop('checked') ? 'ui-icon-check' : 'ui-icon-radio-on'
						});
						viewer.options['cm_'+modifier]= $(this).prop('checked');
						viewer._updateCTX();
					})
				;
			});


			/*****************************************************************************************************\					
			 *****************************************************************************************************
			 *****************************************************************************************************
			 *****************************************************************************************************
			\*****************************************************************************************************/


			if(this.options.scrollWheel) {
				this.element.bind('DOMMouseScroll mousewheel', function(event) {
					if(event.originalEvent.wheelDelta /120 > 0) {
			            viewer.z(viewer.point.z+1);
			        }
			        else{
			            viewer.z(viewer.point.z-1);
			        }
			        viewer._updatePoint3D();
			        event.preventDefault();
				});
			}

			this.wrapper.hover(function() {
				viewer.controls.stop().fadeIn(300);
			}, function() {
				viewer.controls.stop().fadeOut(300);
			});

			this._loadImages();
			
			// when source changes and image is loaded
			var sliceLoaded = false;
			var labelLoaded = false;

			$(viewer.currentSliceImage).on('load', function() {
				sliceLoaded = true;
				if(!viewer.options.showLabelSlices || labelLoaded)
					viewer._updateCTX();
			});

			$(viewer.currentLabelImage).on('load', function() {
				labelLoaded = true;
				if(sliceLoaded)
					viewer._updateCTX();
			});

			this._initPointSelect();

			this.wrapper.dblclick(function(event) {
				if(viewer.expanded)
					viewer.collapse();
				else
					viewer.expand();
			});

			this._updateDimensions();
			this._setValuesFromPoint3D();
			this._update();

			$(window).resize(function() {
				viewer._resize();
			});

			if(this.options.looping)
				this.startLooping();

			this.running = true;
		},

		expand: function() {
			viewer = this;
			this.oldTop = this.element.css('top');
			this.oldHeight = this.element.css('height');
			this.element
				.css({
					zIndex: 199
				})
				.stop().animate({
					top: 0,
					height: '100%',
					width: '100vw'
				}, {
					duration: 600,
					easing: 'easeInOutCubic',
					progress: function() {
						viewer._resize();
					},
					complete: function() {
						viewer.expanded = true;
					}
				})
			;
		},

		collapse: function() {
			this.element
				.stop().animate({
					top: this.oldTop,
					height: this.oldHeight,
					width: '100%'
				}, {
					duration: 400,
					easing: 'easeInOutCubic',
					progress: function() {
						viewer._resize();
					},
					complete: function() {
						viewer.element.css({
							zIndex: 99
						});
						viewer.expanded = false;
					}
				})
			;
		},

		_initPointSelect: function() {
			var viewer = this;
			if(this.options.showPointSelect) {
				this.pointselect = $('<div/>', { 'class': 'pointselect'})
					.appendTo(this.container)
					.css({
						position: 'absolute',
						top: '0',
						left: '0',
						width: '1px',
						height: '1px'
					});
				this.hairV = $('<div/>', { 'class': 'hair vertical'})
					.css({
						position: 'absolute',
						backgroundColor: this.options.hHairColor,
						boxShadow: '0px 0px 4px 1px rgba(255,255,255,0.5)',
						left: '50%',
						height: '100%',
						width: this.options.hairWidth
					});
				this.hairH = $('<div/>', { 'class': 'hair horizontal'})
					.css({
						position: 'absolute',
						backgroundColor: this.options.vHairColor,
						boxShadow: '0px 0px 4px 1px rgba(255,255,255,0.5)',
						top: '50%',
						width: '100%',
						height: this.options.hairWidth,
						marginTop: Math.ceil(-this.options.hairWidth/2)
					});
				this.crosshair = $('<div/>', { 'class': 'crosshair' })
					.css({
						position: 'absolute',
						width: this.width*2,
						height: this.height*2,
						top: -this.height, 
						left: -this.width,
						marginLeft: Math.ceil(-this.options.hairWidth/2)
					})
					.append(this.hairV)
					.append(this.hairH)
					.appendTo(this.pointselect);

				this.pointselect.draggable({
					handle: this.crosshair,
					cursor: "move",
					containment: this.canvas,
					scroll: false,
					drag: function(event, ui) {
						viewer.x(ui.position.left);
						viewer.y(ui.position.top);
						viewer._updatePoint3D();
					}
				});
			}
		},

		_update: function() {
			var xUpdated = this.point.x != this.previousPoint.x;
			var yUpdated = this.point.y != this.previousPoint.y;
			var zUpdated = this.point.z != this.previousPoint.z;

			if(xUpdated) {
				if(this.pointselect)
					this.pointselect.css('left', this.x());
				this._trigger('xchange')
			}
			if(yUpdated) {
				if(this.pointselect)
					this.pointselect.css('top', this.y());
				this._trigger('ychange')
			}
			if(zUpdated) {
				this.currentSliceImage.src = this.images[this.z()].sliceSrc;
				this.currentLabelImage.src = this.images[this.z()].labelSrc;
				this.zSlider.slider('value', this.point.z);
				this._trigger('imagechange');
			}

			this._super();
		},

		_updateDimensions: function() {
			var wAspect = this.wrapper.innerWidth()/this.wrapper.innerHeight(); 
			if(this.options.aspect > wAspect) {
				this.width  = this.wrapper.width();
				this.height = this.width / this.options.aspect;
			} else {
				this.height = this.wrapper.height();
				this.width  = this.height * this.options.aspect;
			}
		},

		_resize: function() {
			// console.log('resize');
			this._updateDimensions();
			var viewer = this;
			viewer.container.width(viewer.width);
			viewer.container.height(viewer.height);
			var oldXMax = viewer.range.x.max;
			var oldYMax = viewer.range.y.max;
			viewer.range.x.max = viewer.width;
			viewer.range.y.max = viewer.height;
			viewer.x(viewer.x()/oldXMax*viewer.range.x.max);
			viewer.y(viewer.y()/oldYMax*viewer.range.y.max);
			viewer.canvas
				.attr('width', viewer.width)
				.attr('height', viewer.height)
			;
			// viewer.controls
			// 	.width(viewer.width)
			// ;
			viewer.pointselect.draggable('option', 'containment', viewer.canvas);
			viewer.pointselect.css({
				top: viewer.y(), 
				left: viewer.x()
			});
			viewer.crosshair.css({
				position: 'absolute',
				width: viewer.width*2,
				height: viewer.height*2,
				top: -viewer.height, 
				left: -viewer.width,
			});
			viewer._updateCTX();
		},

		_updateCTX: function() {
			var viewer = this;
			this.canvas2d.globalAlpha = 1;
			this.canvas2d.drawImage(this.currentSliceImage, 0, 0, this.width, this.height);

			jQuery.each(this.options.canvasModifiers, function(modifier, callback) {
				if(!(callback && ({}).toString.call(callback) === '[object Function]'))
					return;

				if(viewer.options['cm_'+modifier]) {
					callback(viewer.canvas2d);
				}
			});

			sliceLoaded = false;
			labelLoaded = false;
		},

		_loadImages: function() {
			var sliceLoader = new Image();
			var labelLoader = new Image();
			for(i=0; i<this.options.loadNrImages; i++) {
				var index = Math.ceil(this.options.totalNrImages * (i/(this.options.loadNrImages-1)));
				sliceLoader.src = this.options.imgSlicesPath + index + this.options.extension;
				labelLoader.src = this.options.imgLabelsPath + index + this.options.extension;
				this.images[i] = {
					sliceSrc: sliceLoader.src,
					labelSrc: labelLoader.src,
				}
			}
			// console.log(this.images);
		},

		_setOption: function( key, value ) {
	        this.options[ key ] = value;
	        this._update();
	    },

		_destroy: function() {
			this.canvas.remove();
		},

		_setValuesFromPoint3D: function() {
			if(this.ignoreNextUpdate) // don't listen to update initiate by yourself!
				this.ignoreNextUpdate = false;
			else {
				this.axis(this.options.point3DMap.x, this.getAbsoluteValueForAxis(this.options.point3DMap.x, this.options.point3D.point3D('x')));
				this.axis(this.options.point3DMap.y, this.getAbsoluteValueForAxis(this.options.point3DMap.y, this.options.point3D.point3D('y')));
				this.axis(this.options.point3DMap.z, this.getAbsoluteValueForAxis(this.options.point3DMap.z, this.options.point3D.point3D('z')));
			}
		},

		_updatePoint3D: function() {
			this.ignoreNextUpdate = true;
			var viewer = this;
			var point = {
				x: this.getPercentualValueForAxis(viewer.options.point3DMap.x, this.point[viewer.options.point3DMap.x]),
				y: this.getPercentualValueForAxis(viewer.options.point3DMap.y, this.point[viewer.options.point3DMap.y]),
				z: this.getPercentualValueForAxis(viewer.options.point3DMap.z, this.point[viewer.options.point3DMap.z]),
			};
			this.options.point3D.point3D('xyz', point);
		},

		getCanvas: function() {
			return this.canvas;
		},

	    startLooping: function() {
	    	if(!this.options.looping) {
		    	this.options.looping = true;
		    	this.loopIndex = this.currentImageID;
		    	this.loop();
		    }
	    },

	    loop: function() {
			if(this.options.looping) {
				ni = Math.abs(this.loopIndex++);
				if(this.loopIndex > this.options.loadNrImages)
					this.loopIndex = -this.options.loadNrImages

				this.z(ni);

				setTimeout(
					(function(self) { 
			    		return function() {
			    			self.loop(); 
			    		}
		    		})(this), 
		    		this.options.loopSpeed
	    		);
			};
	    },

	    stopLooping: function() {
	    	this.options.looping = false;
	    },
	});
}( jQuery ));

// <![CDATA[

PanoJS.MSG_BEYOND_MIN_ZOOM = null;
PanoJS.MSG_BEYOND_MAX_ZOOM = null;

var panoViewer = null;

var PanoConstants = {
    _overlayName: 'panoOverlay',
    _wrapperName: 'panoWrapper',
    _containerName: 'panoContainer',
    _headerName: 'panoHeader',
    overlayName: function (justName) { return this.getName(this._overlayName, justName); },
    wrapperName: function (justName) { return this.getName(this._wrapperName, justName); },
    containerName: function (justName) { return this.getName(this._containerName, justName); },
    headerName: function (justName) { return this.getName(this._headerName, justName); },
    getName: function (baseName, justName) {
        justName = typeof(justName) == 'undefined' ? false : justName;
        var name = justName ? '' : '#';
        return name + baseName;
    }
}

function createViewer (panoInfo, baseUrl) {
    if (panoViewer) return;
  
    var myPyramid = new ZoomifyPyramid(panoInfo.width, panoInfo.height, 256);
    
    var myProvider = new PanoJS.TileUrlProvider('','','');
    myProvider.assembleUrl = function(xIndex, yIndex, zoom) {
        return baseUrl + '/' + panoInfo.id + '/' + myPyramid.tile_filename( zoom, xIndex, yIndex );
    }

    var options = {
        tileUrlProvider : myProvider,
        tileSize        : myPyramid.tilesize,
        maxZoom         : myPyramid.getMaxLevel(),
        imageWidth      : myPyramid.width,
        imageHeight     : myPyramid.height,
        staticBaseURL   : '/assets/js/panojs3/',
        blankTile       : '/assets/js/panojs3/images/blank.gif',
        loadingTile     : '/assets/js/panojs3/images/progress.gif'
    };

    if (typeof(panoInfo.initialZoom) != 'undefined') {
        options.initialZoom = panoInfo.initialZoom;
    }
    
    panoViewer = new PanoJS('viewer', options);

    Ext.EventManager.addListener( window, 'resize', callback(panoViewer, panoViewer.resize) );
    panoViewer.init();
};

function initViewer(panoData) {
	var panoContainer = $(PanoConstants.containerName());
	var panoHeader = $(PanoConstants.headerName());

	// clear out any existing pano
	destroyViewer();
	
	panoContainer.height($(PanoConstants.overlayName()).dialog('option', 'height') - 70);

	// set the new one
	if (!panoData) {
		console.log('must pass pano information');
		return
	}
	panoHeader.html(panoData.title);

	var viewer = $('<div></div>');
	viewer.attr({
		id: 'viewer',
		style: 'width: 100%; height: 100%',
		class: 'viewer'
	});
	panoContainer.append(viewer);

	createViewer(panoData, '/assets/img/panorama/' + panoData.panoGroup);
}

function destroyViewer() {
	$(PanoConstants.containerName()).empty();
	$(PanoConstants.headerName()).empty();
	panoViewer = null;
}

function showOverlay() {
	var panoData = $(this).data('panoInfo');
	var dHeight = Math.ceil($(window).height() * .95);
	var dWidth = Math.ceil($(window).width() * .95);
	$(PanoConstants.overlayName()).dialog({
		modal: true,
		draggable: false,
		resizable: false,
		height: dHeight,
		width: dWidth,
		title: panoData.title
	});
	initViewer(panoData);
}

function hideOverlay() {
	destroyViewer();
	$(PanoConstants.overlayName())
		.height(null)
		.hide();
}
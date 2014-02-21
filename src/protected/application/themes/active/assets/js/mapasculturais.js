MapasCulturais = MapasCulturais || {};

$(function(){
    if(MapasCulturais.mode != 'development')
        console.log = function(){};

    MapasCulturais.TemplateManager.init();
    MapasCulturais.Modal.initKeyboard('.js-dialog');
    MapasCulturais.Modal.initDialogs('.js-dialog');
    MapasCulturais.Modal.initButtons('.js-open-dialog');
    MapasCulturais.Video.setupVideoGallery('.js-videogallery');
    MapasCulturais.Search.init(".js-search");

     if($('#funcao-do-agente').length){
        $('#funcao-do-agente .js-options li').click(function(){
            var roleToRemove = $('#funcao-do-agente .js-selected span').data('role');
            var roleToAdd = $(this).data('role');
            var label = $(this).find('span').html();

            var change = function(){
                $('#funcao-do-agente .js-selected span').html(label);
                $('#funcao-do-agente .js-selected span').data('role', roleToAdd);
            };

            if(roleToRemove)
                $.post(MapasCulturais.baseURL + 'agent/removeRole/' + MapasCulturais.request.id, {role: roleToRemove}, function(r){ if(r && !r.error) change(); });

            if(roleToAdd)
                $.post(MapasCulturais.baseURL + 'agent/addRole/' + MapasCulturais.request.id, {role: roleToAdd}, function(r){ if(r && !r.error) change(); });


        });
    }
});


MapasCulturais.TemplateManager = {
    templates: {},
    init: function(){
        var $templates = $('.js-mustache-template');
        var $this = this;
        $templates.each(function(){
            $this.templates[$(this).attr('id')] = $(this).text();
            $(this).remove();
        });
    },

    getTemplate: function(id){
        if(this.templates[id])
            return this.templates[id];
        else
            return null;
    }
};

MapasCulturais.defaultAvatarURL = MapasCulturais.assetURL +'/img/avatar-padrao.png';

MapasCulturais.isEditable = MapasCulturais.request.action == 'create' || MapasCulturais.request.action == 'edit';

MapasCulturais.Messages = {
    delayToFadeOut: 5000,
    fadeOutSpeed: 'slow',

	showMessage: function(type, message){
        var $message = $('<div class="mensagem ' + type + '">"').html(message);
        $('#editable-entity').append($message);
        $message.css('display','inline-block').css('display', 'inline-block').delay(this.delayToFadeOut).fadeOut(this.fadeOutSpeed, function(){ $(this).remove(); });
	},

    success: function(message){
        this.showMessage('sucesso', message);
    },

    error: function(message){
        this.showMessage('erro', message);
    },

    help: function(message){
        this.showMessage('ajuda', message);
    },

    alert: function(message){
        this.showMessage('alerta', message);
    }

}

MapasCulturais.confirm = function (message, cb){
    if(confirm(message))
        cb();
};

MapasCulturais.Modal = {
    time: 'fast',
    cssInit: {position:'fixed', left:0, top:0, width: $(window).width(),  opacity:0 },
    cssFinal: {left: $(window).width()/4, top:$(window).height()/4, width: $(window).width()/2, height: $(window).height()/2, opacity:1},

    cssBg: {position:'fixed', background:'white', top:0, left:0, width:'100%', zIndex:999},
    cssBgOpacity: .95,

    $bg: null,
    initKeyboard: function (selector){
        $(document.body).keyup(function (e){
            //if(e.keyCode == 27)
            //    $(selector + ' .js-close').click();
        });
    },

    initDialogs: function(selector){
        if(!MapasCulturais.Modal.$bg){
            MapasCulturais.Modal.$bg = $('<div></div>');
            MapasCulturais.Modal.$bg.css(this.cssBg);
            MapasCulturais.Modal.$bg.click(function(){
                MapasCulturais.Modal.close(selector);
            });
            $('body').append(MapasCulturais.Modal.$bg.hide());
        }
        $(selector).each(function(){
            if($(this).find('.js-dialog-disabled').length)
                return;

            if($(this).data('dialog-init'))
                return;

            var $dialog = $(this);
            /*$dialog.hide();  Moved to style.css */

            $dialog.data('dialog-init', 1);
            $dialog.prepend('<h2>' + $(this).attr('title') + '</h2>');
            $dialog.prepend('<a href="#" class="js-close icone icon_close"></a>');

            // close button
            $dialog.find('.js-close').click(function (){
                MapasCulturais.Modal.close(selector);
                return false;
            });
        });
    },

    initButtons: function(selector){

        if($(selector).data('button-initialized')) return false;
        else $(selector).data('button-initialized', true);
        $(selector).each(function(){
            var dialog_selector = $(this).data('dialog');
            var $dialog = $(dialog_selector);
            if($dialog.find('.js-dialog-disabled').length)
                $(this).addClass('inactive').addClass('hltip').attr('title', $dialog.find('.js-dialog-disabled').data('message'));

        });
        $(selector).click(function(){
            if($(this).hasClass('inactive'))
                return false;

            var dialog_selector = $(this).data('dialog');
            MapasCulturais.Modal.open(dialog_selector);
            if( $(this).data('dialog-callback') )
                eval( $(this).data('dialog-callback'))($(this));
            return false;
        });
    },

    close: function(selector){
        $('body').css('overflow','auto');
        var $dialog = $(selector);
        $dialog.css(MapasCulturais.Modal.cssFinal).animate(MapasCulturais.Modal.cssInit, MapasCulturais.Modal.time, function(){
            $dialog.hide();
        });
        MapasCulturais.Modal.$bg.animate({opacity:0}, MapasCulturais.Modal.time, function(){
            $(this).hide();
        });
        return;
    },

    open: function(selector){
        $('body').css('overflow','hidden');
        var $dialog = $(selector);
        this.$bg.css({opacity:0, height:$('body').height()}).show().animate({opacity:this.cssBgOpacity},this.time);

        $dialog.find('div.mensagem.erro').html('').hide();
//        if($dialog.find('form').length)
//            $dialog.find('form').get(0).reset();
        $dialog.css(this.cssInit).show().animate(this.cssFinal, MapasCulturais.Modal.time, function(){
            $dialog.find('input,textarea').not(':hidden').first().focus();
        });
        return;
    }
};

MapasCulturais.MetaListUpdateDialog = function ($caller){
    var $dialog = $($caller.data('dialog'));
    var $form = $dialog.find('.js-metalist-form');
    var group = $dialog.data('metalist-group');

    var item = $caller.data('item') || {};

    $form.data('metalist-action', $caller.data('metalist-action'));
    $form.data('metalist-group', group);

    if($caller.data('metalist-action') == 'edit'){
        $form.find('input.js-metalist-group').attr('name', '').val('');
        $form.attr('action', MapasCulturais.baseURL + 'metalist/single/' + item.id);
    }else{
        $form.find('input.js-metalist-group').attr('name', 'group').val(group);
        $form.attr('action', $dialog.data('action-url'));
    }

    $form.data('response-target', $caller.data('response-target'));

    // define os labels do form
    $form.find('label.js-metalist-title span').html($dialog.data('metalist-title-label'));
    $form.find('label.js-metalist-value span').html($dialog.data('metalist-value-label'));
    $form.find('label.js-metalist-description span').html($dialog.data('metalist-description-label'));

    // define os valores dos inputs do form
    $form.find('input.js-metalist-title').val(item.title);
    $form.find('input.js-metalist-value').val(item.value);
    $form.find('textarea.js-metalist-description').val(item.description);



    var responseTemplate = '';
    //If Edit or insert:
    if($caller.data('metalist-action') == 'edit'){
        responseTemplate = $dialog.data('response-template');
    }else{
        $dialog.find('h2').html($caller.data('dialog-title'));
        responseTemplate = $caller.data('response-template');
    }

    $form.find('script[type="js-response-template"]').text(responseTemplate);
    //console.log(responseTemplate);

    //if this metalist is of videos,changing a video url results in getting its title from its provider's api and set it to its title field
    if(group == 'videos') {
        $form.find('input.js-metalist-value').on('change', function(){
            MapasCulturais.Video.getAndSetVideoData($(this).val(), $form.find('input.js-metalist-title'), MapasCulturais.Video.setTitle);
        });
    }
};


MapasCulturais.Video = {
    collection : {},
    parseURL : function(url){
        return purl(url);
    },
    isYoutube : function(parsedURL){
            return parsedURL.attr('host').indexOf('youtube') != -1;
    },
    getYoutubeData : function(youtubeVideoID){
        return {
            thumbnalURL : 'http://img.youtube.com/vi/'+videoID+'/0.jpg',
            playerURL : '//www.youtube.com/embed/'+videoID+'?html5=1'
        }
    },
    getVideoBasicData : function(url){
        var parsedURL = this.parseURL(url);
        var host = parsedURL.attr('host');
        var provider = '';
        var videoID = '';
        if(parsedURL.attr('host').indexOf('youtube') != -1 ){
            provider = 'youtube';
            videoID = parsedURL.param('v');
        }else if(parsedURL.attr('host').indexOf('vimeo') != -1){
            provider = 'vimeo';
            videoID = parsedURL.attr('path').split('/')[1];
        }
        return {
            'parsedURL' : parsedURL,
            'provider' : provider,
            'videoID' : videoID
        }
    },
    setupVideoGallery : function(gallerySelector){

        if($(gallerySelector).length == 0)
            return false;

        $( gallerySelector + ' .js-metalist-item-display').each(function(){
            MapasCulturais.Video.getAndSetVideoData($(this).data('videolink'), $(this).parent(), MapasCulturais.Video.setupVideoGalleryItem);
        });
        var $firstItem = $( gallerySelector + ' .js-metalist-item-display:first').parent();
        if(!$firstItem.length) {
            $('#video-player').hide();
            return false;
        }
        $('iframe#video_display').attr('src', $firstItem.data('player-url'));
        $firstItem.addClass('active');
    },
    setupVideoGalleryItem : function(videoData, $element){
        //$Element should be a.js-metalist-item-display
        $element.attr('href', '#video');
        $element.data('player-url', videoData.playerURL);
        $element.find('img').attr('src', videoData.thumbnailURL);

        var video_id = $element.attr('id');

        $element.on('click', function(){
            $('iframe#video_display').attr('src', videoData.playerURL);
            $('iframe#video_display').data('open-video', $(this).attr('id'));
            $(this).parent().find('.active').removeClass('active');
            $(this).addClass('active');
        });

        var $container = $element.parent();
        if($element.find('.js-remove-item').length){
            $element.find('.js-remove-item').data('remove-callback', function(){
                console.log(video_id, $container.find('>li').length,  $('iframe#video_display').data('open-video'));
                if($('iframe#video_display').data('open-video') == video_id)
                    $('iframe#video_display').attr('src', '');

                if($container.find('>li').length == 0)
                    $('#video-player').hide();
            });
        }

        if($container.find('>li').length == 1){
            $element.addClass('active');
            $('iframe#video_display').attr('src', videoData.playerURL);
        }

    },
    setTitle : function(videoData, $element){
        //$Element should be .js-metalist-form input.js-metalist-title
        //console.log(videoData);
        $element.val(videoData.videoTitle);
    },
    getAndSetVideoData : function (videoURL, $element, callback){
        videoURL = videoURL.trim();
        var videoData = {
            parsedURL : purl(videoURL),
            provider : '',
            videoID : '',
            thumbnailURL : '',
            playerURL : '',
            details : {}
        };

        if(videoData.parsedURL.attr('host').indexOf('youtube') != -1){
            videoData.provider = 'youtube';
            videoData.videoID = videoData.parsedURL.param('v');
            videoData.thumbnailURL = 'http://img.youtube.com/vi/'+videoData.videoID+'/0.jpg';
            videoData.playerURL = '//www.youtube.com/embed/'+videoData.videoID+'?html5=1';
            callback(videoData, $element);
            $.getJSON('https://gdata.youtube.com/feeds/api/videos/'+videoData.videoID+'?v=2&alt=json', function(data) {
                videoData.details = data;
                videoData.videoTitle = data.entry.title.$t;
                MapasCulturais.Video.collection[videoURL] = videoData;
                callback(videoData, $element);
                return videoData;
            });
        }else if(videoData.parsedURL.attr('host').indexOf('vimeo') != -1){
            videoData.provider = 'vimeo';
            videoData.videoID = videoData.parsedURL.attr('path').split('/')[1];
            $.getJSON('http://www.vimeo.com/api/v2/video/'+videoData.videoID+'.json?callback=?', {format: "json"}, function(data) {
                videoData.details = data[0];
                videoData.thumbnailURL = data[0].thumbnail_small;
                videoData.playerURL = '//player.vimeo.com/video/'+videoData.videoID+'';
                videoData.videoTitle = data[0].title;
                callback(videoData, $element);
                MapasCulturais.Video.collection[videoURL] = videoData;
                return videoData;
            });
        }else{
            //no valid provider
            videoData.thumbnailURL = 'http://www.bizreport.com/images/shutterstock/2013/04/onlinevideo_135877229-thumb-380xauto-2057.jpg';
            callback(videoData, $element);
            return videoData;
        }

        var withDetails = function(){
            // get details from youtube api
            if(!videoData.details) {
                $.getJSON('https://gdata.youtube.com/feeds/api/videos/'+videoData.videoID+'?v=2&alt=json', {format: "json"}, function(data) {
                    videoData.details = data;
                    functionName(videoData, $element);
                    return videoData;
                });
            }
        };
    }
};

MapasCulturais.Search = {
    limit: 10,

    init : function(selector){
        console.log($(selector));
        if( $(selector).length === 0 || $(selector).hasClass('select2-offscreen')) return false;

        $(selector).each(function(){
            var $selector = $(this);

            $selector.editable({
                type:'select2',

                name: $selector.data('field-name') ? $selector.data('field-name') : null,

                select2:{
                    width: $selector.data('search-box-width'),
                    placeholder: $selector.data('search-box-placeholder'),
                    minimumInputLength: 2,
                    allowClear: $selector.data('allow-clear'),
                    ajax: {
                        url: MapasCulturais.baseURL + 'api/' + $selector.data('entity-controller') + '/find',
                        dataType: 'json',
                        quietMillis: 100,
                        data: function (term, page) { // page is the one-based page number tracked by Select2
                            var searchParams = MapasCulturais.Search.getEntityController(term, page, $selector);

                            var format = $selector.data('selection-format');

                            if(MapasCulturais.Search.formats[format] && MapasCulturais.Search.formats[format].ajaxData)
                                searchParams = MapasCulturais.Search.formats[format].ajaxData(searchParams, $selector);
                            else
                                searchParams = MapasCulturais.Search.ajaxData(searchParams, $selector);

                            return searchParams;
                        },
                        results: function (data, page) {
                            //console.log('results function, data.length: '+ data.length+', page '+page)

                            //var more = (page * 10) < data.length; // whether or not there are more results available

                            var more = data.length == MapasCulturais.Search.limit;

                            // notice we return the value of more so Select2 knows if more results can be loaded
                            return {results: data, more: more};
                        }
                    },
                    formatResult: function(entity){
                        var format = $selector.data('selection-format');
                        console.log('formatResult >>>', format, entity);
                        if(MapasCulturais.Search.formats[format] && MapasCulturais.Search.formats[format].result)
                            return MapasCulturais.Search.formats[format].result(entity, $selector);
                        else
                            return MapasCulturais.Search.formatResult(entity, $selector);
                    }, // omitted for brevity, see the source of this page

                    formatSelection: function(entity){
                        var format = $selector.data('selection-format');
                        console.log('formatSelection >>>', format, entity);
                        return MapasCulturais.Search.formats[format].selection(entity, $selector);
                    }, // omitted for brevity, see the source of this page

                    formatNoMatches: function(term){
                        var format = $selector.data('selection-format');
                        console.log('formatNoMatches >>>', format, term);
                        return MapasCulturais.Search.formats[format].noMatches(term, $selector);
                    },
                    escapeMarkup: function (m) { return m; }, // we do not want to escape markup since we are displaying html in results
                }
            });
            if($selector.data('disable-buttons') ){
                $selector.on('shown', function(e, editable) {
                    var format = $selector.data('selection-format');

                    /*Hide editable buttons because the option showbuttons:false autosubmitts the form adding two agents...
                    Also Auto-open select2 on editable.shown and auto-close editable popup on select2-close*/

                    e.stopPropagation();
                    if (arguments.length == 2) {
                        setTimeout(function() {
                            editable.input.$input.parents('.control-group').addClass('editable-popup-botoes-escondidos');
                        }, 0);
                        setTimeout(function() {
                            editable.input.$input.select2("open");
                        }, 200);
                        editable.input.$input.on('select2-close', function(){
                            setTimeout(function() {
                                $selector.editable('hide');
                            }, 200);
                        });
                    }
                });
            }
            if($selector.data('auto-open') ){
                $selector.on('shown', function(e, editable) {
                    setTimeout(function() {
                        editable.input.$input.select2("open");
                    }, 200);
                });
            }
            var format = $selector.data('selection-format');
            $selector.on('save',function(){
                try{
                    MapasCulturais.Search.formats[format].onSave($selector);
                }catch(e){}
            });
            $selector.on('hidden',function(){
                try{
                    MapasCulturais.Search.formats[format].onHidden($selector);
                }catch(e){}
            });

        });
    },



    getEntityController : function(term, page, $selector){

        var entitiyControllers = {
            'default':{
                name: 'ilike(*'+term.replace(' ', '*')+'*)', //search term
                '@select': 'id,name,metadata,files,terms,type',
                '@limit': MapasCulturais.Search.limit, // page size
                '@page': page,
                '@order':'name ASC'// page number
            },
            'agent':{ //apenas adicionei a shortDescription
                name: 'ilike(*'+term.replace(' ', '*')+'*)', //search term,
                '@select': 'id,name,metadata,files,terms,type',
                '@limit': MapasCulturais.Search.limit, // page size
                '@page': page,
                '@order':'name ASC'// page number
            }
        };

        if(entitiyControllers[$selector.data('entity-controller')]){
            return entitiyControllers[$selector.data('entity-controller')];
        }else{
            return entitiyControllers['default'];
        }
    },

    processEntity: function(entity){
        entity.areas = function(){
            if(this.terms && this.terms.area)
                return this.terms.area.join(', ');
            else
                return '';
        };

        entity.linguagens = function(){
            if(this.terms && this.terms.linguagem)
                return this.terms.linguagem.join(', ');
            else
                return '';
        };

        entity.tags = function(){
            if(this.terms && this.terms.tags)
                return this.terms.tags.join(', ');
            else
                return '';
        };

        entity.thumbnail = function(){
             //console.log(entity.files);
            if(this.files && this.files.avatar && this.files.avatar.files && this.files.avatar.files['avatarSmall'])
                return this.files.avatar.files['avatarSmall'].url;
            else
                return '';
        };

    },

    renderTemplate : function(template, entity){
        this.processEntity(entity);
        return Mustache.render(template, entity);
    },

    getEntityThumbnail : function (entity, thumbName){
        //console.log(entity.files);
        if(!entity.files || entity.files.length == 0 || !entity.files[thumbName] || entity.files[thumbName].length == 0)
            return '';
        else{
            if(entity.files[thumbName].files['avatarSmall'])
                return entity.files[thumbName].files['avatarSmall'].url;
        }
    },

    formatResult : function (entity, $selector) {
        var searchResultTemplate = $($selector.data('search-result-template')).text();
        return this.renderTemplate(searchResultTemplate, entity);
    },

    ajaxData: function(searchParams, $selector){
        var excludedIds = MapasCulturais.request.controller === $selector.data('entity-controller') && MapasCulturais.request.id ? [MapasCulturais.request.id] : [];

        if(excludedIds.length > 0)
            searchParams.id = '!in(' + excludedIds.toString() + ')';

        return searchParams;
    },

    formats: {
        chooseSpace: {
            onSave: function($selector){
                var entity = $selector.data('entity'),
                    avatarUrl = MapasCulturais.defaultAvatarURL,
                    shortDescription = entity.shortDescription.replace("\n",'<br/>');

                $selector.data('value', entity.id);

                try{
                    avatarUrl = entity.files.avatar.files.avatarSmall.url;
                }catch(e){};

                $selector.parents('.js-space').find('.js-space-avatar').attr('src', avatarUrl);
                $selector.parents('.js-space').find('.js-space-description').html(shortDescription);
                $selector.parents('form').find('input[name="spaceId"]').val(entity.id);
            },
            onHidden : function ($selector) {
                $selector.removeClass('editable-unsaved');
            },

            selection: function(entity, $selector){
                $selector.data('entity', entity);
                return entity.name;
            },

            noMatches: function(term, $selector){
                return 'Nenhum espaço encontrado.';
            },

            onClear: function($selector){ },

            ajaxData: function(searchParams, $selector){
                if($selector.data('value'))
                    searchParams.id = '!in('+$selector.data('value')+')';

                //if(!MapasCulturais.cookies.get('mapasculturais.adm'))
                //    searchParams.owner = 'in(@me.spaces)';

                searchParams['@select'] += ',shortDescription,';
                return searchParams;
            }
        },

        createAgentRelation: {
            selection: function (entity, $selector) {
                var $selectionTarget =   $($selector.data('selection-target'));
                var targetAction =      $selector.data('target-action');
                var selectionTemplate = $($selector.data('selection-template')).text();

                var groupname = $selector.parents('.js-related-group').find('.js-related-group-name').text();

                $.post(
                    MapasCulturais.baseURL + MapasCulturais.request.controller + '/createAgentRelation/id:' + MapasCulturais.request.id,
                    {agentId: entity.id, group:groupname, has_control: '0'}
                );


                if(targetAction == 'append'){
                    MapasCulturais.RelatedAgents.addAgentToGroup(groupname, entity);
                    return $selector.data('search-box-placeholder');
                }else{
                    $selectionTarget.html(markup);
                    return entity.name;
                }
            },

            noMatches: function (term, $selector){
                var noResultTemplate = $($selector.data('no-result-template')).text();
                $('#dialog-adicionar-integrante').data('group-element', $selector.parents('.js-related-group').find('.js-relatedAgentsContainer'));
                //return term + ' HAHAHA!';
                return noResultTemplate.replace('{{group}}', $selector.parents('.js-related-group').find('.js-related-group-name').text());
            },

            ajaxData: function(searchParams, $selector){
                var group = $selector.parents('.js-related-group').find('.js-related-group-name').text();

                var excludedIds = MapasCulturais.request.controller === 'agent' && MapasCulturais.request.id? [MapasCulturais.request.id] : [];
                try{
                    if(MapasCulturais.agentRelationGroupExludeIds[group])
                        excludedIds = excludedIds.concat(MapasCulturais.agentRelationGroupExludeIds[group]);
                }catch(e){}

                excludedIds = excludedIds.concat (
                    $selector.parents('.js-related-group').find('.agentes .avatar').map(
                        function(){ return $(this).data('id'); }
                ).toArray());

                console.log(excludedIds);

                if ( excludedIds.length > 0)
                    searchParams.id = '!in('+excludedIds.toString()+')';

                return searchParams;
            }
        },

        parentSpace:{
            selection: function(entity, $selector){
                return entity.name;
            },

            noMatches: function(term, $selector){
                return 'Nenhum espaço encontrado.';
            },

            onClear: function($selector){
            }
        },

        parentProject:{
            selection: function(entity, $selector){
                return entity.name;
            },

            noMatches: function(term, $selector){
                return 'Nenhum projeto encontrado.';
            },

            onClear: function($selector){
            }
        },

        projectRegistration: {
            onSave: function($selector){
                var entity = $selector.data('entity'),
                    avatarUrl = MapasCulturais.defaultAvatarURL,
                    shortDescription = entity.shortDescription.replace("\n",'<br/>');

                $('#registration-agent-id').val(entity.id);

            },

            onHidden : function ($selector) {
                $selector.removeClass('editable-unsaved');
            },

            selection: function(entity, $selector){
                $selector.data('entity', entity);
                return entity.name;
            },

            noMatches: function(term, $selector){
                return 'Nenhum agente encontrado.';
            },

            onClear: function($selector){ },

            ajaxData: function(searchParams, $selector){
                var excludedIds = MapasCulturais.request.controller === 'agent' && MapasCulturais.request.id? [MapasCulturais.request.id] : [];

                excludedIds.push($selector.data('value'));

                if ( excludedIds.length > 0)
                    searchParams.id = '!in('+excludedIds.toString()+')';

                if(!MapasCulturais.cookies.get('mapasculturais.adm'))
                    searchParams.user = 'eq(@me)';

                if($selector.data('profiles-only'))
                    searchParams.isUserProfile = 'eq(true)';

                searchParams['@select'] += ',shortDescription,';
                return searchParams;
            }

        },

        changeOwner:{
            onSave: function($selector){
                var entity = $selector.data('entity'),
                    avatarUrl = MapasCulturais.defaultAvatarURL,
                    shortDescription = entity.shortDescription.replace("\n",'<br/>');

                $selector.data('value', entity.id);

                try{
                    avatarUrl = entity.files.avatar.files.avatarSmall.url;
                }catch(e){};

                $selector.parents('.js-owner').find('.js-owner-avatar').attr('src', avatarUrl);
                $selector.parents('.js-owner').find('.js-owner-description').html(shortDescription);

            },

            selection: function(entity, $selector){
                $selector.data('entity', entity);
                return entity.name;
            },

            noMatches: function(term, $selector){
                return 'Nenhum agente encontrado.';
            },

            onClear: function($selector){ },

            ajaxData: function(searchParams, $selector){
                var excludedIds = MapasCulturais.request.controller === 'agent' && MapasCulturais.request.id? [MapasCulturais.request.id] : [];

                excludedIds.push($selector.data('value'));

                if ( excludedIds.length > 0)
                    searchParams.id = '!in('+excludedIds.toString()+')';

                if(!MapasCulturais.cookies.get('mapasculturais.adm'))
                    searchParams.user = 'eq(@me)';

                if($selector.data('profiles-only'))
                    searchParams.isUserProfile = 'eq(true)';

                searchParams['@select'] += ',shortDescription,';
                return searchParams;
            }
        }
    }
};


MapasCulturais.cookies = {
    get: function(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    },

    set: function(key, value, options){
        options = $.extend({}, options);

        if (value == null) {
            options.expires = -1;
        }

        if (typeof options.expires === 'number') {
            var days = options.expires, t = options.expires = new Date();
            t.setDate(t.getDate() + days);
            options.expires = options.expires.toUTCString();
        }else{
            options.expires = 'Session';
        }

        value = String(value);

        return (document.cookie = [
            encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
            options.expires ? '; expires=' + options.expires : '', // use expires attribute, max-age is not supported by IE
            options.path    ? '; path=' + options.path : '',
            options.domain  ? '; domain=' + options.domain : '',
            options.secure  ? '; secure' : ''
            ].join(''));
    }
};
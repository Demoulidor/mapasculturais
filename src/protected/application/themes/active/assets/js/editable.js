MapasCulturais = MapasCulturais || {};
tabIndex = function() { window.tabEnabled = true };
jQuery(function(){
    $.fn.editableform.buttons = '<button type="submit" class="editable-submit">ok</button><button type="button" class="editable-cancel"><span class="icone icon_close"></span></button>';
    MapasCulturais.Editables.init('#editable-entity');
    MapasCulturais.AjaxUploader.init();
    MapasCulturais.MetalistManager.init();
    //MapasCulturais.RelatedAgentsEditables.init('.js-relatedAgentsContainer');


    MapasCulturais.RelatedAgentsEditables.init('.js-related-group');
    MapasCulturais.RelatedAgentsEditables.initButtonAddRelatedGroup('.js-related-group-add');


    MapasCulturais.Remove.init();


    $('.js-registration-action').click(function(){
        if($(this).hasClass('selected'))
            return false;

        var href = $(this).data('href');
        var data = {agentId: $(this).data('agent-id')};
        var $this = $(this);

        $.post(href, data, function(response){
            $this.parent().find('.js-registration-action').removeClass('selected');
            $this.addClass('selected');

            // status = 1 (aprovado)
            // status = -6 (rejeitado)
            if(response.status == -6){
                MapasCulturais.RelatedAgents.removeAgentFromGroup('registration', response.agentId);

            }else if(response.status == 1){
                $.getJSON('http://mapasculturais.local/api/agent/findOne', {id: 'eq('+response.agentId+')', '@select': 'id,name,avatar,metadata,files,terms,type,singleUrl'}, function(r){
                    MapasCulturais.RelatedAgents.addAgentToGroup('registration', r);

                });
            }

        });
        return false;
    });


    //Máscaras de telefone
    var masks = ['(00) 00000-0000', '(00) 0000-00009'];

    $('.js-editable').on('shown', function(e, editable) {
        if ($(this).hasClass('js-mask-phone')) {
            editable.input.$input.mask(masks[1], {onKeyPress:
               function(val, e, field, options) {
                   field.mask(val.length > 14 ? masks[0] : masks[1], options) ;
               }
            });
        }

        //Experimental Tab Index
        if(window.tabEnabled) {
            var $el = editable.$element;
            editable.input.$input.on('keydown', function(e) {
                if(e.which == 9) {                                                      // when tab key is pressed
                    e.preventDefault();
                    if(e.shiftKey) {                                                    // shift + tab
                        $(this) .blur();
                        $el.parents().prevAll(":has(.editable):first") // find the parent of the editable before this one in the markup
                        .find(".js-editable:last").editable('show');                    // grab the editable and display it
                    } else {                                                            // just tab
                        $(this) .blur();
                        $el.parents().nextAll(":has(.editable):first") // find the parent of the editable after this one in the markup
                        .find(".js-editable:first").editable('show');                   // grab the editable and display it
                    }
                }
            });
            editable.$element.on('hidden', function(e, reason) {
                if(reason == 'save' || reason == 'nochange')
                    $el.parents().nextAll(":has(.editable):first").find(".editable:first").editable('show');
            });
        }

    });


    if($('.js-verified').length){
        $('.js-verified').click(function(){
            var verify = $(this).data('verify-url');
            var removeVerification = $(this).data('remove-verification-url');
            console.log(verify, removeVerification);
            if($('.js-verified').hasClass('inactive')){
                $.getJSON(verify, function(r){
                    if(r && !r.error){
                        $('.js-verified').removeClass('inactive');
                    }
                });
            }else{
                $.getJSON(removeVerification, function(r){
                    if(r && !r.error){
                        $('.js-verified').addClass('inactive');
                    }
                });
            }

            return false;
        });
    }
});

$(window).on('beforeunload', function(){
    if($('.editable-unsaved').length){
        return 'Há alterações não salvas nesta página.';
    }
});

MapasCulturais.Remove = {
    init: function(){
        $('body').on('click','.js-remove-item', function(e){
            e.stopPropagation();
            var $this = $(this);
            MapasCulturais.confirm('Deseja remover este item?', function(){
                var $target = $($this.data('target'));
                var href = $this.data('href');

                $.getJSON(href,function(r){
                    if(r.error){
                        MapasCulturais.Messages.error(r.data);
                    }else{
                        var cb = function(){};
                        if($this.data('remove-callback'))
                            cb = $this.data('remove-callback');
                        $target.remove();
                        cb();
                    }
                });
            });

            return false;
        });
    }
}

MapasCulturais.Editables = {

    dataSelector: 'edit',
    baseTarget : '',

    init : function(editableEntitySelector) {
        this.baseTarget = MapasCulturais.baseURL+$(editableEntitySelector).data('entity');
        this.createAll();

        if(MapasCulturais.isEditable){
            this.setButton(editableEntitySelector);
            this.initTaxonomies();
            this.initTypes();
        }
    },

    initTaxonomies: function (){
        $('.js-editable-taxonomy').each(function(){
            var taxonomy = $(this).data('taxonomy');

            var select2_option = {
                tags: [],
                tokenSeparators: [","]
            };


            if(MapasCulturais.taxonomyTerms[taxonomy])
                select2_option.tags = MapasCulturais.taxonomyTerms[taxonomy];

            if($(this).data('restrict'))
                select2_option.createSearchChoice = function() { return null; };


            var config = {
                name: 'terms[' + taxonomy + ']',
                type: 'select2',
                select2: select2_option
            };

            //change the default poshytip animation speed both from 300ms to:
            $.fn.poshytip.defaults.showAniDuration = 80;
            $.fn.poshytip.defaults.hideAniDuration = 40;

            $(this).editable(config);
        });
    },

    initTypes: function(){
        $('.js-editable-type').each(function(){
            var entity = $(this).data('entity');
            $.each(MapasCulturais.entityTypes[entity], function(i, obj){
                obj.text = obj.name;
                obj.value = obj.id;
            });
            var config = {
                name: 'type',
                type: 'select',
                source: MapasCulturais.entityTypes[entity]
            };
            $(this).editable(config);
        });
    },

    getEditableElements : function(){
        if(MapasCulturais.isEditable)
            return $('.js-editable, .js-editable-taxonomy, .js-editable-type');
        else
            return $('.js-xedit');
    },

    createAll : function (){
        var entity = MapasCulturais.Editables.entity;
        MapasCulturais.Editables.getEditableElements().each(function(){

            var field_name = $(this).data(MapasCulturais.Editables.dataSelector);

            var input_type;

            if(!entity[field_name])
                return;

            var config = {
                name: field_name,
                type: 'text',
                emptytext: entity[field_name].label,
                placeholder: entity[field_name].label
            };


            switch (entity[field_name].type){
                case 'text':
                    config.type = 'textarea';
                    break;

                case 'select':
                    config.type = 'select';
                    config.source = entity[field_name].options;
                    break;

                case 'date':
                    config.type = 'date';
                    config.format = 'yyyy-mm-dd';
                    config.viewformat = 'dd/mm/yyyy';
                    config.datepicker = { weekStart: 1 };
                    delete config.placeholder;

                    break;
            }

            //Sets data-value = element's innerHTML
            if(config.type == 'select' && !$(this).data('value'))
                $(this).data('value', $(this).html());

            $(this).editable(config);
            $(this).editable('option', 'validate', function(v) {
                //If Required
//                    if(entity[field_name].required){
//                        if(!v) return 'Campo Obrigatórios!';
//                    }
            });

            if($(this).data('notext')){
                $(this).text('');
                var that = this
                $(this).on('hidden', function(){
                    $(that).text('');
                });
            }
        });

    },


    setButton : function (editableEntitySelector){
        var $submitButton = $($(editableEntitySelector).data('submit-button-selector'));
        $submitButton.click(function(){
            if($submitButton.data('clicked'))
                return false;

            $submitButton.data('clicked', 'sim');

            var action = $(editableEntitySelector).data('action');
            var target;
            if(action != 'create')
                target = MapasCulturais.Editables.baseTarget+'/single/'+$(editableEntitySelector).data('id');
            else
                target = MapasCulturais.Editables.baseTarget;

            MapasCulturais.Editables.getEditableElements().add('.js-include-editable').editable('submit', {
                url: target,
                ajaxOptions: {
                    dataType: 'json', //assuming json response
                    type: action == 'create' ? 'post' : 'post'//'put'
                },
                success: function(response){
                    $submitButton.data('clicked',false);
                    if(response.error){
                        var $field = null;
                        var errors = '';
                        var unknow_errors = [];
                        var field_found = false;
                        var firstShown = false;
                        $('.js-response-error').remove();
                        for(var p in response.data){
                            if(p.substr(0,5) == 'term-')
                                $field = $('#' + p);
                            else if(p == 'type')
                                $field = $('.js-editable-type');
                            else
                                $field = $('.js-editable[data-edit="' + p + '"]');

                            for(var k in response.data[p]){
                                if($field.length){
                                    field_found = true;
                                    var errorHtml = '<span title="'+'Erro: ' + response.data[p][k]+'" class="erro hltip js-response-error" data-hltip-classes="hltip-erro"></span>';
                                    $field.parent().append(errorHtml);
                                }else{
                                    unknow_errors.push(response.data[p][k]);
                                }
                            }
                            if(!firstShown) {
                                firstShown = true;
                                $field.editable('show');
                            }
                            $field.on('save', function(){
                                $(this).parent().find('.erro.hltip').remove();
                            });
                        }

                        if(field_found)
                            MapasCulturais.Messages.error('Corrija os erros indicados abaixo.');

                        if(unknow_errors){
                            for(var i in unknow_errors){
                                MapasCulturais.Messages.error(unknow_errors[i]);
                            }
                        }


                    }else{
                        if(action === 'create')
                            location.href = MapasCulturais.Editables.baseTarget+'/edit/'+response.id;

                        if($('.js-sp_distrito').length > 0      && response['sp_distrito'])         $('.js-sp_distrito').html(response['sp_distrito']);
                        if($('.js-sp_regiao').length > 0        && response['sp_regiao'])           $('.js-sp_regiao').html(response['sp_regiao']);
                        if($('.js-sp_subprefeitura').length > 0 && response['sp_subprefeitura'])    $('.js-sp_subprefeitura').html(response['sp_subprefeitura']);

                        MapasCulturais.Messages.success('Edições salvas.');

                        $('.editable-unsaved').
                                css('background-color','').
                                removeClass('editable-unsaved').
                                parent().
                                removeClass('erro');
                    }

                },
                error : function(response){
                    $submitButton.data('clicked',false);
                    MapasCulturais.Messages.error('Um erro inesperado aconteceu.');
                }
            });
        });

    }
};

MapasCulturais.AjaxUploader = {
    animationTime: 100,
    init: function() {
        // bind form using 'ajaxForm'
        $('.js-ajax-upload').ajaxForm({
            //target:        '#output1',   // target element(s) to be updated with server response
            //beforeSubmit:  showRequest,  // pre-submit callback
            success: function (response, statusText, xhr, $form)  {

                if(response.error){
                    var group = $form.data('group');
                    var error_message = typeof response.data == 'string' ? response.data : response.data[group];
                    $form.find('div.mensagem.erro').html(error_message).fadeIn(this.animationTime).delay(5000).fadeOut(this.animationTime);
                    return;
                }

                var $target = $($form.data('target'));
                var group = $form.find('input:file').attr('name');

                var template = $form.find('script').text();

                switch($form.data('action').toString()){
                    case 'replace':
                        var html = Mustache.render(template, response[group]);
                        $target.replaceWith($(html));
                    break;
                    case 'set-content':

                        var html = Mustache.render(template, response[group]);
                        console.log(template, response, html);
                        $target.html(html);
                    break;
                    case 'a-href':
                        console.log($target, response, response[group].url);
                        try{
                            $target.attr('href', response[group].url);
                        }catch (e){}

                    break;
                    case 'image-src':
                        try{
                            if($form.data('transform'))
                                $target.attr('src', response[group].files[$form.data('transform')].url);
                            else
                                $target.attr('src', response[group].url);
                        }catch (e){}

                    break;
                    case 'background-image':
                        $target.each(function(){
                            try{
                                if($form.data('transform'))
                                    $(this).css('background-image', 'url(' + response[group].files[$form.data('transform')].url + ')');
                                else
                                    $(this).css('background-image', 'url(' + response[group].url + ')');
                            }catch (e){}
                        });
                    break;

                    case 'append':
                        for(var i in response[group]){

                            if(!response[group][i].description)
                               response[group][i].description = response[group][i].name;

                           var html = Mustache.render(template, response[group][i]);
                           $target.append(html);
                       }
                    break;

                }

                $form.get(0).reset();

                $form.parents('.js-dialog').find('.js-close').click();
            },

            // other available options:
            //url:       url         // override for form's 'action' attribute
            //type:      type        // 'get' or 'post', override for form's 'method' attribute
            dataType:  'json'        // 'xml', 'script', or 'json' (expected server response type)
            //clearForm: true        // clear all form fields after successful submit
            //resetForm: true        // reset the form after successful submit

            // $.ajax options can be used here too, for example:
            //timeout:   3000
        });
    }
};

MapasCulturais.MetalistManager = {
    init : function() {
        // bind form using 'ajaxForm'
        $('.js-metalist-form').ajaxForm({
            //target:        '#output1',   // target element(s) to be updated with server response
            //beforeSubmit:  showRequest,  // pre-submit callback

            beforeSubmit:function(arr, $form, options){
                //por enquanto validando apenas o vídeo contendo vimeo ou youtube e o link contendo algum protocolo...
                var group = $form.parents('.js-dialog').data('metalist-group');
                var $linkField = $form.find('input.js-metalist-value');
                var $errorTag = $form.find('.mensagem.erro');
                $errorTag.html('');

                if(group == 'videos'){
                    if($.trim($form.find('input.js-metalist-title').val()) == ''){
                        $errorTag.html('Insira um título para seu vídeo.').show();
                        return false;
                    }

                    var parsedURL = purl($linkField.val());
                    //console.log(parsedURL);
                    if (parsedURL.attr('host').indexOf('youtube') == -1 && parsedURL.attr('host').indexOf('vimeo')  == -1){
                        $errorTag.html('Insira uma url de um vídeo do YouTube ou do Vimeo.').show();

                        return false;
                    }
                }else if (group == 'links'){

                    if($.trim($form.find('input.js-metalist-title').val()) == ''){
                        $errorTag.html('Insira um título para seu link.').show();
                        return false;
                    }

                    var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                    if (!pattern.test($linkField.val())){
                        $errorTag.html('A url do link é inválida, insira uma url completa como http://www.google.com/.').show();
                        return false;
                    }
                }
            },
            success: function (response, statusText, xhr, $form)  {
                if(response.error){
                    return;
                }

                var $target = $($form.data('response-target'));
                var group = $form.data('metalist-group');
                var action = $form.data('metalist-action');
                var template = $form.find('script[type="js-response-template"]').text();
                var $editBtn;

                var $html = $(Mustache.render(template, response));

                $editBtn = $html.find('.js-open-dialog');
                $editBtn.data('item', response);

                switch(action){

                    case 'edit':
                        $target.replaceWith($html);
                        $target = $html;
                        MapasCulturais.Modal.initButtons($editBtn);
                        //if this metalist is of videos, update the new displayed item passing the video url
                        if(group == 'videos'){
                            MapasCulturais.Video.getAndSetVideoData(response.value, $target.find('.js-metalist-item-display'), MapasCulturais.Video.setupVideoGalleryItem);
                        }
                        break;

                    default: //append (insert)
                        $target.append($html);
                        MapasCulturais.Modal.initButtons($editBtn);

                        //if this metalist is of videos, update the new displayed item passing the video url
                        if(group == 'videos'){
                            MapasCulturais.Video.getAndSetVideoData(response.value, $('.js-metalist-item-id-'+response.id), MapasCulturais.Video.setupVideoGalleryItem);

                            $('#video-player:hidden').show();

                        }

                }
                $form.parents('.js-dialog').find('.js-close').click();
                //$form.get(0).reset();
            },

            // other available options:
            //url:       url         // override for form's 'action' attribute
            //type:      type        // 'get' or 'post', override for form's 'method' attribute
            dataType:  'json'        // 'xml', 'script', or 'json' (expected server response type)
            //clearForm: true        // clear all form fields after successful submit
            //resetForm: true        // reset the form after successful submit

            // $.ajax options can be used here too, for example:
            //timeout:   3000
        });

        // Delete Button
        $('.js-metalist-form .js-metalist-item-delete').on('click', function(){
            if(confirm('Tem Certeza de que deseja excluir este item?')){
                $form = $(this).parent();
                $form.find('input:hidden[name="metalist_action"]').val('delete');
                $form.find('input:submit').click();
                $form.parent().hide();
            }
        });
    }
};

MapasCulturais.RelatedAgentsEditables = {

    openCreateAgentDialog : function(buttonElement){
        MapasCulturais.Modal.open(buttonElement.dataset.dialog);
        //console.log($(buttonElement).parents('.select2-search'))
        var $editableName = $(buttonElement.dataset.dialog).find('.js-related-editable[data-related-edit="agent[name]"]');
        $editableName.editable('setValue',
            $(buttonElement).parents('#select2-drop').find('.select2-input').val()
        );
        var $group = $('#dialog-adicionar-integrante .js-group');
        $group.editable('setValue', $(buttonElement).data('group'));
        $('.select2-offscreen').each(function(){$(this).select2('close');});
    },

    initButtonAddRelatedGroup : function(selector){

        if($(selector).length == 0) return false;


        var $dialog = $($(selector).data('dialog'));
        //console.log('d',$dialog);
        var $textInput = $dialog.find('input:text');
        var $submitButton = $dialog.find('input:submit');


        $(selector).click(function(){ $textInput.focus();});


        $submitButton.click(function(e){

            e.preventDefault();

            var newGroupName = $textInput.val();
            //If no typed group name, nothing to do
            if(newGroupName.trim().length == 0) return;
            //Resets the inputm
            $textInput.val('');

            var template = $('#related-group-template').text();
            template = template.replace(new RegExp('{{group}}', 'g'), newGroupName);
            //Insere o novo grupo antes do container do botão de add group
            $(template).insertBefore($(selector).parent());
            MapasCulturais.Search.init('.js-related-group[data-related-group="'+newGroupName+'"] .js-search');

            //Closes the modal window
            $dialog.find('.js-close').click();
        });
    },

    init : function(selector) {
        if($(selector).length == 0) return false;

        $(selector).each(function(){

            /*Init control switch and remove buttons in list view*/
            $(this).on('click', '.slider-button', function(){
                var $input = $(this);
                var hasControl = !$input.hasClass('on');

                if (!hasControl)
                    $input.removeClass('on').html('Não');
                else
                    $input.addClass('on').html('Sim');

                $.post(
                    MapasCulturais.baseURL + MapasCulturais.request.controller + '/setRelatedAgentControl/id:' + MapasCulturais.request.id,
                    {
                        agentId: $(this).parents('.avatar').data('id'),
                        hasControl: hasControl
                    },
                    function(response) {
                        console.log(response);
                        if (response.error) {
                            if ($input.hasClass('on'))
                                $input.removeClass('on').html('Não');
                            else
                                $input.addClass('on').html('Sim');
                        }
                    }
                );

                console.log('Edit Agent: '+ $(this).parents('.avatar').data('id')+'. Has Control: ' + $(this).hasClass('on')+'. Parent Agent ID: '+MapasCulturais.request.id);
            });

            $(this).on('click', '.js-remove-agent', function(){
                $agent = $(this).parents('.avatar');
                if(confirm('Tem certeza de que deseja remover este agente?')){
                    $.post(
                        MapasCulturais.baseURL + MapasCulturais.request.controller + '/removeAgentRelation/id:' + MapasCulturais.request.id,
                        {agentId: $agent.data('id'), group: $agent.parents('.js-related-group').data('related-group')},
                        function(response){
                            console.log(response);
                            if(!response.error)
                                if($agent.parents('.js-related-group').find('.avatar').length == 0){
                                    $agent.parents('.js-related-group').remove();
                                }else{
                                    $agent.remove();
                                }
                        }
                    );
                    console.log('Removed Related Agent whose ID is '+ $agent.data('id'));
                }
            });
        });

        var $dialog = $('#dialog-adicionar-integrante');

        //Setup the submit button
        $dialog.find('.js-related-submit').click(function(){
            var $form = $dialog.find('form')

            var $submitButton = $(this);
            $($submitButton.data('target')+' .js-related-editable').editable('submit', {
                url: $submitButton.data('action')=='create'?
                        MapasCulturais.baseURL + MapasCulturais.request.controller + '/createAgentRelation/' + MapasCulturais.request.id :
                        MapasCulturais.baseURL+'agent/single/id:'+$submitButton.data('id')+'/',
                ajaxOptions: {
                    dataType: 'json', //assuming json response
                    type: 'post'
                },
                success: function(response){
                    if(response.errors){
                        var errors = '';
                        for(var p in response.errors){
                            for(var k in response.errors[p]){
                                errors = errors + '<p>' + response.errors[p][k] + '</p>';
                            }
                        }
                        $('#ajax-response-errors .js-dialog-content').html(errors);
                        MapasCulturais.Modal.open('#ajax-response-errors');
                    }else{
                        var $agent = MapasCulturais.Search.renderTemplate($('#agent-response-template').text(), response);
                        console.log($agent, $dialog.data('group-element'));
                        $dialog.data('group-element').append($agent);
                        $dialog.find('.js-close').click();
                    }
                },
                error : function(response){
                    $('#ajax-response-errors .js-dialog-content').html(response);
                    MapasCulturais.Modal.open('#ajax-response-errors');
                }
            });
        });

        $dialog.find('.js-related-editable').each(function(){
                //Set Editable
                $(this).editable({
                    name : $(this).data('related-edit'),
                    mode: 'inline',
                    inputclass: 'js-related-editable-inputClass'
                    //placement: 'right'
                });
            });
    }
}

MapasCulturais.RelatedAgents = {
    addAgentToGroup: function(group, agent){
        var template = MapasCulturais.TemplateManager.getTemplate('agent-response-template');
        var $group = $('[data-related-group="' + group + '"] .js-relatedAgentsContainer');
        MapasCulturais.Search.processEntity(agent);
        var html = Mustache.render(template, agent);
        console.log(template, agent);
        $group.append(html);
        MapasCulturais.RelatedAgentsEditables.init('[data-related-group="' + group + '"]');
    },
    removeAgentFromGroup: function(group, agent_id){
        var $group = $('[data-related-group="' + group + '"] .js-relatedAgentsContainer');
        $group.find("div.avatar[data-id=\"" + agent_id + "\"]").remove();
    }
};
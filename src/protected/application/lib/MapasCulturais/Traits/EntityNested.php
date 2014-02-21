<?php
namespace MapasCulturais\Traits;
use MapasCulturais\App;

trait EntityNested{

    /**
     * This entity has Nested Objects
     *
     * @return bool true
     */
    static function usesNested(){
        return true;
    }

    function setParentId($parent_id){
        if($parent_id)
            $parent = $this->repo()->find($parent_id);
        else
            $parent = null;

        $this->setParent($parent);
    }

    function setParent($parent){
        $error1 = App::txt('O pai não pode ser o filho.');
        $error2 = App::txt('O pai deve ser do mesmo tipo que o filho.');

        if(!key_exists('parent', $this->_validationErrors))
            $this->_validationErrors['parent'] = array();

        if($parent && $parent->id === $this->id){
            $this->_validationErrors['parent'][] = $error1;
        }elseif(key_exists('parent', $this->_validationErrors) && in_array($error1, $this->_validationErrors['parent'])){
            $key = array_search($error, $this->_validationErrors['parent']);
            unset($this->_validationErrors['parent'][$key]);
        }

        if($parent && $parent->className !== $this->className){
            $this->_validationErrors['parent'][] = $error2;
        }elseif(key_exists('parent', $this->_validationErrors) && in_array($error2, $this->_validationErrors['parent'])){
            $key = array_search($error, $this->_validationErrors['parent']);
            unset($this->_validationErrors['parent'][$key]);
        }

        if(!$this->_validationErrors['parent'])
            unset($this->_validationErrors['parent']);

        $this->parent = $parent;
    }
}
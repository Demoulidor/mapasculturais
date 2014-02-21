<?php

namespace MapasCulturais\Entities;

use Doctrine\ORM\Mapping as ORM;
use MapasCulturais\App;

/**
 * Project
 *
 * @ORM\Table(name="project")
 * @ORM\Entity
 * @ORM\HasLifecycleCallbacks
 */
class Project extends \MapasCulturais\Entity
{
    use \MapasCulturais\Traits\EntityTypes,
        \MapasCulturais\Traits\EntityMetadata,
        \MapasCulturais\Traits\EntityFiles,
        \MapasCulturais\Traits\EntityMetaLists,
        \MapasCulturais\Traits\EntityTaxonomies,
        \MapasCulturais\Traits\EntityAgentRelation,
        \MapasCulturais\Traits\EntityNested,
        \MapasCulturais\Traits\EntityVerifiable;


    protected static $validations = array(
        'name' => array(
            'required' => 'O nome do projeto é obrigatório'
        ),
        'type' => array(
            'required' => 'O tipo do projeto é obrigatório',
        ),
        'registrationFrom' => array(
            '$this->validateDate($value)' => 'O valor informado não é uma data válida'
        ),
        'registrationTo' => array(
            '$this->validateDate($value)' => 'O valor informado não é uma data válida',
            '$this->validateRegistrationDates()' => 'A data final das inscrições deve ser maior ou igual a data inicial'
        )
    );

    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer", nullable=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="SEQUENCE")
     * @ORM\SequenceGenerator(sequenceName="project_id_seq", allocationSize=1, initialValue=1)
     */
    protected $id;

    /**
     * @var integer
     *
     * @ORM\Column(name="type", type="smallint", nullable=false)
     */
    protected $_type;

    /**
     * @var string
     *
     * @ORM\Column(name="name", type="string", length=255, nullable=false)
     */
    protected $name;

    /**
     * @var string
     *
     * @ORM\Column(name="short_description", type="text", nullable=true)
     */
    protected $shortDescription;

    /**
     * @var string
     *
     * @ORM\Column(name="long_description", type="text", nullable=true)
     */
    protected $longDescription;

    /**
     * @var boolean
     *
     * @ORM\Column(name="public_registration", type="boolean", nullable=false)
     */
    protected $publicRegistration = false;


    /**
     * @var \DateTime
     *
     * @ORM\Column(name="registration_from", type="datetime", nullable=true)
     */
    protected $registrationFrom;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="registration_to", type="datetime", nullable=true)
     */
    protected $registrationTo;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="create_timestamp", type="datetime", nullable=false)
     */
    protected $createTimestamp;

    /**
     * @var integer
     *
     * @ORM\Column(name="status", type="smallint", nullable=false)
     */
    protected $status = self::STATUS_ENABLED;



    /**
     * @var \MapasCulturais\Entities\Project
     *
     * @ORM\ManyToOne(targetEntity="MapasCulturais\Entities\Project")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="parent_id", referencedColumnName="id")
     * })
     */
    protected $parent;

    /**
     * @var \MapasCulturais\Entities\Agent
     *
     * @ORM\ManyToOne(targetEntity="MapasCulturais\Entities\Agent")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="agent_id", referencedColumnName="id")
     * })
     */
    protected $owner;


    protected $_avatar;

    /**
     * @var bool
     *
     * @ORM\Column(name="is_verified", type="boolean", nullable=false)
     */
    protected $isVerified = false;


    /**
     * Returns the owner of this project
     * @return \MapasCulturais\Entities\Agent
     */
    function getOwner(){

        if(!$this->id) return App::i()->user->profile;

        return $this->owner;
    }


    function getAvatar(){
        if(!$this->_avatar)
            $this->_avatar = $this->getFile('avatar');

        return $this->_avatar;
    }

    function setOwnerId($owner_id){
        $owner = App::i()->repo('Agent')->find($owner_id);
        if($owner)
            $this->owner = $owner;
    }

    function setRegistrationFrom($date){
        $this->registrationFrom = new \DateTime($date);
        $this->registrationFrom->setTime(0,0,0);
    }


    function setRegistrationTo($date){
        $this->registrationTo = new \DateTime($date);
        $this->registrationTo->setTime(23, 59, 59);
    }


    function validateDate($value){
        return !$value || $value instanceof \DateTime;
    }

    function validateRegistrationDates() {
        if($this->registrationFrom && $this->registrationTo)
            return $this->registrationFrom <= $this->registrationTo;
        else
            return true;
    }

    function isRegistrationOpen(){
        $cdate = new \DateTime;
        return $cdate >= $this->registrationFrom && $cdate <= $this->registrationTo;
    }

    function getRegistrationByAgent(Agent $agent){
        $app = App::i();
        $group = $app->projectRegistrationAgentRelationGroupName;
        $relation_class = $this->getAgentRelationEntityClassName();
        return $app->repo($relation_class)->findOneBy(array('group' => $group, 'owner' => $this, 'agent' => $agent));
    }

    function isRegistered(Agent $agent){
        return (bool) $this->getRegistrationByAgent($agent);
    }

    function isRegistrationApproved(Agent $agent){
        $registration = $this->getRegistrationByAgent($agent);
        return $registration && $registration->status = AgentRelations\Project::STATUS_ENABLED;
    }

    function register(Agent $agent, File $registrationForm = null){
        $app = App::i();

        $app->applyHookBoundTo($this, 'project.register:before', array($agent, $registrationForm));

        if(!$this->isRegistrationOpen())
            return $app->txt("The registration is not open.");

        $group = $app->projectRegistrationAgentRelationGroupName;

        $relation_class = $this->getAgentRelationEntityClassName();

        if($this->isRegistered($agent))
            return $app->txt("This agent is already registered in this project.");

        $relation = new $relation_class;
        $relation->agent = $agent;
        $relation->owner = $this;
        $relation->group = $group;
        $relation->status = AgentRelations\Project::STATUS_REGISTRATION;

        $relation->save();

        if($registrationForm){
            $registrationForm->owner = $relation;

            $registrationForm->save();
        }

        $app->em->flush();

        $this->clearAgentRelationCache();

        $app->applyHookBoundTo($this, 'project.register:after', array($relation));
        return $relation;
    }


    function approveRegistration(Agent $agent){
        $app = App::i();

        $this->checkPermission('approveRegistration');

        $registration = $this->getRegistrationByAgent($agent);

        $app->applyHookBoundTo($this, 'project.approveRegistration:before', array($registration));

        $registration->status = AgentRelations\Project::STATUS_ENABLED;

        $registration->save(true);
        $this->clearAgentRelationCache();

        $app->applyHookBoundTo($this, 'project.approveRegistration:after', array($registration));

        return $registration;
    }


    function rejectRegistration(Agent $agent){
        $app = App::i();

        $this->checkPermission('rejectRegistration');

        $registration = $this->getRegistrationByAgent($agent);

        $app->applyHookBoundTo($this, 'project.rejectRegistration:before', array($registration));

        $registration->status = AgentRelations\Project::STATUS_REGISTRATION_REJECTED;

        $registration->save(true);
        $this->clearAgentRelationCache();

        $app->applyHookBoundTo($this, 'project.rejectRegistration:after', array($registration));

        return $registration;
    }


    function getRegistrations($status = null){
        if(!$this->id)
            return array();

        $app = App::i();

        $group = $app->projectRegistrationAgentRelationGroupName;

        $relation_class = $this->getAgentRelationEntityClassName();

        $params = array('group' => $group, 'owner' => $this);

        $status_dql = is_null($status) ? '' : 'AND e.status = ' . $status;

        //return $app->repo($relation_class)->findBy($params, array('status' => 'ASC'));

        $q = $app->em->createQuery("
            SELECT
                e,
                a
            FROM
                $relation_class e
                JOIN e.agent a
            WHERE e.group = :group
            $status_dql
            ORDER BY
                a.name ASC
        ");

        $q->setParameter('group', $group);

        $result = $q->getResult();

        return $result;
    }

    function getApprovedRegistrations(){
        return $this->getRegistrations(AgentRelations\Project::STATUS_ENABLED);
    }

    //============================================================= //
    // The following lines ara used by MapasCulturais hook system.
    // Please do not change them.
    // ============================================================ //

    /** @ORM\PostLoad */
    public function postLoad($args = null){ parent::postLoad($args); }

    /** @ORM\PrePersist */
    public function prePersist($args = null){ parent::prePersist($args); }
    /** @ORM\PostPersist */
    public function postPersist($args = null){ parent::postPersist($args); }

    /** @ORM\PreRemove */
    public function preRemove($args = null){ parent::preRemove($args); }
    /** @ORM\PostRemove */
    public function postRemove($args = null){ parent::postRemove($args); }

    /** @ORM\PreUpdate */
    public function preUpdate($args = null){ parent::preUpdate($args); }
    /** @ORM\PostUpdate */
    public function postUpdate($args = null){ parent::postUpdate($args); }
}
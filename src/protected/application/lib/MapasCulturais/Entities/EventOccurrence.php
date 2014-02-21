<?php

namespace MapasCulturais\Entities;

use Doctrine\ORM\Mapping as ORM;
use MapasCulturais\App;


/**
 * EventOccurrence
 *
 * @ORM\Table(name="event_occurrence")
 * @ORM\Entity
 * @ORM\HasLifecycleCallbacks
 */
class EventOccurrence extends \MapasCulturais\Entity
{

    protected static $validations = array(
        'startsOn' => array(
            'required' => 'Data de inicio é obrigatória',
            '$value instanceof \DateTime' => 'Data de inicio inválida'
         ),
        'endsOn' => array(
            '$value instanceof \DateTime' => 'Data final inválida',
         ),
        'startsAt' => array(
            'required' => 'Hora de inicio é obrigatória',
            '$value instanceof \DateTime' => 'Hora de inicio inválida',
         ),
        'endsAt' => array(
            'required' => 'Hora final é obrigatória',
            '$value instanceof \DateTime' => 'Hora final inválida',
            '$value > $this->startsAt' => 'A hora final deve ser depois da hora inicial'
         ),
        'frequency' => array(
            'required' => 'Frequência é obrigatória',
            '$this->validateFrequency($value)' => 'Frequência inválida'
        ),
        'separation' => array(
            'v::positive()' => 'Erro interno'
         ),
        'until' => array(
            '$value instanceof \DateTime' => 'Data final inválida',
            '$value > $this->startsOn' => 'Data final antes da inicial'
         ),
        'event' => array(
            'required' => 'Evento é obrigatório'
         ),
        'space' => array(
            'required' => 'Espaço é obrigatório'
         ),
    );

    function validateFrequency($value) {
        if ($this->flag_day_on === false) return false;
        if (in_array($value, ['daily', 'weekly', 'monthly'])) {
            return !is_null($this->until);
        }

        return true;
    }

    static function convert($value='', $format='Y-m-d H:i')
    {
        if ($value === null || $value instanceof \DateTime) {
            return $value;
        }

        $d = \DateTime::createFromFormat($format, $value);
        if ($d && $d->format($format) == $value) {
            return $d;
        } else {
            return $value;
        }
    }

    private $flag_day_on = true;

    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer", nullable=false)
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="SEQUENCE")
     * @ORM\SequenceGenerator(sequenceName="event_occurrence_id_seq", allocationSize=1, initialValue=1)
     */

    protected $id;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="starts_on", type="date", nullable=true)
     */
    protected $_startsOn;

    function setStartsOn($value) {
        $this->_startsOn = self::convert($value, 'Y-m-d');
    }

    function getStartsOn() {
        return $this->_startsOn;
    }


    /**
     * @var \DateTime
     *
     * @ORM\Column(name="ends_on", type="date", nullable=true)
     */
    protected $_endsOn;

    function setEndsOn($value) {
        $this->_endsOn = self::convert($value, 'Y-m-d');
    }

    function getEndsOn() {
        return $this->_endsOn;
    }


    /**
     * @var \DateTime
     *
     * @ORM\Column(name="starts_at", type="datetime", nullable=true)
     */
    protected $_startsAt;

    function setStartsAt($value) {
        $this->_startsAt = self::convert($value, 'H:i');
    }

    function getStartsAt() {
        return $this->_startsAt;
    }


    /**
     * @var \DateTime
     *
     * @ORM\Column(name="ends_at", type="datetime", nullable=true)
     */
    protected $_endsAt;

    function setEndsAt($value) {
        $this->_endsAt = self::convert($value, 'H:i');
    }

    function getEndsAt() {
        return $this->_endsAt;
    }

    /**
     * @var frequency
     *
     * @ORM\Column(name="frequency", type="frequency", nullable=true)
     */
    protected $frequency;

    /**
     * @var integer
     *
     * @ORM\Column(name="separation", type="integer", nullable=false)
     */
    protected $separation = 1;

    /**
     * @var integer
     *
     * @ORM\Column(name="count", type="integer", nullable=true)
     */
    protected $count;

    /**
     * @var \DateTime
     *
     * @ORM\Column(name="until", type="date", nullable=true)
     */
    protected $_until;

    function setUntil($value) {
        $this->_until = self::convert($value, 'Y-m-d');
    }

    function getUntil() {
        return $this->_until;
    }

    /**
     * @var string
     *
     * @ORM\Column(name="timezone_name", type="text", nullable=false)
     */
    protected $timezoneName = 'Etc/UTC';

    /**
     * @var \MapasCulturais\Entities\Event
     *
     * @ORM\ManyToOne(targetEntity="MapasCulturais\Entities\Event")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="event_id", referencedColumnName="id")
     * })
     */
    protected $event;

    /**
     * @var \MapasCulturais\Entities\Space
     *
     * @ORM\ManyToOne(targetEntity="MapasCulturais\Entities\Space")
     * @ORM\JoinColumns({
     *   @ORM\JoinColumn(name="space_id", referencedColumnName="id")
     * })
     */
    protected $space;


    function getRecurrences() {
        if ($this->id) {
            return App::i()->repo('EventOccurrenceRecurrence')->findBy(['eventOccurrence'=> $this]);
        } else {
            return array();
        }
    }

    /**
     * @var string
     *
     * @ORM\Column(name="rule", type="text", nullable=false)
     */
    protected $_rule;

    function setRule($value) {
        if ($value === '') {
            $this->_rule = '';
            return;
        }
        $value = (array) $value;
        $this->_rule = json_encode($value);

        $this->startsAt = @$value['startsAt'];
        $this->endsAt = @$value['endsAt'];

        $this->startsOn = @$value['startsOn'];
        $this->until = @$value['until'] ? $value['until'] : null;
        $this->frequency = @$value['frequency'];

        if ($this->validationErrors) {
            return;
        }

        foreach ($this->recurrences as $recurrence) {
            $recurrence->delete();
        }

        if (@$value['frequency']) {
            $freq = $this->frequency;
            $days = @$value['day'];
            switch ($freq) {
                case 'weekly':
                    $this->flag_day_on = false;

                    if (is_null($days)) break;
                    foreach ($days as $key => $value) {
                        if ($value === 'off') break;

                        $this->flag_day_on = true;
                        $rec = new EventOccurrenceRecurrence;
                        $rec->eventOccurrence = $this;
                        $rec->day = (int) $key;
                        $rec->week = null;
                        $rec->month = null;

                        $rec->save();
                    }
                    break;

                case 'monthly':
                    if (@$value['monthly']==='week') {
                        $this->flag_day_on = false;

                        if (is_null($days)) break;
                        foreach ($days as $key => $value) {
                            if ($value === 'off') break;

                            $this->flag_day_on = true;
                            $rec = new EventOccurrenceRecurrence;
                            $rec->eventOccurrence = $this;
                            $rec->day = (int) $key;
                            $rec->week = 1;  # TODO: calc week
                            $rec->month = null;
                            $rec->save();
                        }
                    } else {
                        $rec = new EventOccurrenceRecurrence;
                        $rec->eventOccurrence = $this;
                        $rec->day = $this->startsOn === null ? 0 : $this->startsOn->format('j');
                        $rec->week = null;
                        $rec->month = null;
                    }

                    break;
            }
        }


    }

    function getRule() {
        return json_decode($this->_rule);
    }

    function translateFrequency($key){
        //if()
    }

    function jsonSerialize() {
        return array(
            'id' => $this->id,
            'rule'=> $this->rule,
            'startsOn' => $this->startsOn,
            'startsAt' => $this->startsAt,
            'endsOn' => $this->endsOn,
            'endsAt' => $this->endsAt,
            'frequency' => $this->frequency,
            'separation' =>  $this->separation,
            'count' =>  $this->count,
            'until' =>  $this->until,
            'space' => $this->space ? array('id' => $this->space->id, 'name' => $this->space->name, 'singleUrl' => $this->space->singleUrl, 'shortDescription' => $this->space->shortDescription, 'avatar' => $this->space->avatar, 'location'=>$this->space->location) : null,
            'event' => $this->event ? array('id' => $this->event->id, 'name' => $this->event->name, 'shortDescription' => $this->event->shortDescription, 'avatar' => $this->space->avatar) : null,
            'editUrl' => $this->editUrl,
            'deleteUrl' => $this->deleteUrl,
        );
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
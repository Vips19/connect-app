/**
 * Milestone component
 *
 * Renders one milestone in timeline. Inside it renders:
 * - milestone title
 * - milestone edit form (if open)
 * - component depend on the milestone type
 */
import React from 'react'
import PT from 'prop-types'
import _ from 'lodash'
import moment from 'moment'
import cn from 'classnames'

import LoadingIndicator from '../../../../../components/LoadingIndicator/LoadingIndicator'
import Form from '../Form'
import MilestoneTypePhaseSpecification from '../milestones/MilestoneTypePhaseSpecification'
import MilestoneTypeProgress from '../milestones/MilestoneTypeProgress'
import MilestoneTypeCheckpointReview from '../milestones/MilestoneTypeCheckpointReview'
import MilestoneTypeFinalDesigns from '../milestones/MilestoneTypeFinalDesigns'
import MilestoneTypeDelivery from '../milestones/MilestoneTypeDelivery'
import MilestoneTypeFinalFixes from '../milestones/MilestoneTypeFinalFixes'
import MilestoneTypeAddLinks from '../milestones/MilestoneTypeAddLinks'
import DotIndicator from '../DotIndicator'
import MobilePage from '../../../../../components/MobilePage/MobilePage'
import MediaQuery from 'react-responsive'
import XMartIcon from '../../../../../assets/icons/x-mark.svg'

import { MILESTONE_STATUS, SCREEN_BREAKPOINT_MD } from '../../../../../config/constants'

import PERMISSIONS from '../../../../../config/permissions'
import {hasPermission} from '../../../../../helpers/permissions'

import './Milestone.scss'
class Milestone extends React.Component {
  constructor(props) {
    super(props)

    this.deletePost = this.deletePost.bind(this)
    this.hoverHeader = this.hoverHeader.bind(this)
    this.unHoverHeader = this.unHoverHeader.bind(this)
    this.toggleEditLink = this.toggleEditLink.bind(this)
    this.toggleMobileEditLink = this.toggleMobileEditLink.bind(this)
    this.closeEditForm = this.closeEditForm.bind(this)
    this.updateMilestoneWithData = this.updateMilestoneWithData.bind(this)
    this.updateMilestoneContent = this.updateMilestoneContent.bind(this)
    this.completeMilestone = this.completeMilestone.bind(this)
    this.completeFinalFixesMilestone = this.completeFinalFixesMilestone.bind(this)
    this.extendMilestone = this.extendMilestone.bind(this)
    this.submitFinalFixesRequest = this.submitFinalFixesRequest.bind(this)
    this.milestoneEditorChanged = this.milestoneEditorChanged.bind(this)

    this.state = {
      activeMenu: '',
      isHoverHeader: false,
      isEditing: false,
      isMobileEditing: false,
      disableSubmit: true
    }
  }

  componentDidMount() {
    const contentList = []
    this.setState(contentList)
    !!this.props.navLinks && this.props.navLinks.map((item) => {
      item.isActive && this.setState({ activeMenu: item.id })
    })
  }

  componentWillReceiveProps(nextProps) {
    const { milestone } = this.props
    const { isEditing, isMobileEditing } = this.state

    if ((isEditing || isMobileEditing) && milestone.isUpdating && !nextProps.milestone.isUpdating && !nextProps.error) {
      this.closeEditForm()
    }
  }

  deletePost(index) {
    const contentList = this.state.contentList
    contentList.splice(index, 1)
    this.setState(contentList)
  }

  hoverHeader() {
    this.setState({ isHoverHeader: true })
  }

  unHoverHeader() {
    this.setState({ isHoverHeader: false })
  }

  toggleEditLink() {
    this.setState({ isEditing: true })
  }

  closeEditForm() {
    this.setState({ isEditing: false, isMobileEditing: false, disableSubmit: true })
  }

  toggleMobileEditLink() {
    this.setState({ isMobileEditing: true })
  }

  isActualStartDateEditable() {
    const { milestone, currentUser } = this.props
    const isActive = milestone.status === MILESTONE_STATUS.ACTIVE
    const isCompleted = milestone.status === MILESTONE_STATUS.COMPLETED
    return (isActive || isCompleted) && currentUser.isAdmin

  }

  isCompletionDateEditable() {
    const { milestone, currentUser } = this.props
    const isCompleted = milestone.status === MILESTONE_STATUS.COMPLETED
    return isCompleted && currentUser.isAdmin
  }

  updateMilestoneWithData(values) {
    const { milestone, updateMilestone } = this.props
    const milestoneData = {
      ...values
    }
    if (values.actualStartDate) {
      milestoneData.actualStartDate = moment.utc(new Date(values.actualStartDate))
    }
    if (values.completionDate) {
      milestoneData.completionDate = moment.utc(new Date(values.completionDate))
    }
    updateMilestone(milestone.id, milestoneData)
  }

  milestoneEditorChanged(values) {
    if (!this.props.milestone) {
      if (this.state.disableSubmit) {
        this.setState({ disableSubmit: false })
      }
      return
    }
    for (const key in values) {
      if (values.hasOwnProperty(key)) {
        const element = values[key]
        let compareElement = this.props.milestone[key]
        if (!(compareElement instanceof String)) {
          compareElement = compareElement.toString()
        }
        if (element !== compareElement) {
          if (this.state.disableSubmit) {
            this.setState({ disableSubmit: false })
          }
          return
        }
      }
    }
    if (!this.state.disableSubmit) {
      this.setState({ disableSubmit: true })
    }
  }

  updateMilestoneContent(contentProps, metaDataProps) {
    const { updateMilestone, milestone } = this.props

    const updatedMilestone = {
      details: {
        ...milestone.details,
        content: {
          ..._.get(milestone, 'details.content', {}),
          ...contentProps,
        },
        metadata: {
          ..._.get(milestone, 'details.metadata', {}),
          ...metaDataProps
        }
      }
    }

    updateMilestone(milestone.id, updatedMilestone)
  }

  completeMilestone(updatedProps = {}) {
    const { completeMilestone, milestone } = this.props

    const details = _.get(updatedProps, 'details', {})
    updatedProps.details = {
      ...details,
      metadata: {
        ..._.get(details, 'metadata', {}),
        waitingForCustomer: false
      }
    }
    completeMilestone(milestone.id, updatedProps)
  }
  completeFinalFixesMilestone(updatedProps = {}) {
    const { completeFinalFixesMilestone, milestone } = this.props

    const details = _.get(updatedProps, 'details', {})
    updatedProps.details = {
      ...details,
      metadata: {
        ..._.get(details, 'metadata', {}),
        waitingForCustomer: false
      }
    }
    completeFinalFixesMilestone(milestone.id, updatedProps)
  }

  extendMilestone(extendDuration, updatedProps) {
    const { extendMilestone, milestone } = this.props

    extendMilestone(milestone.id, extendDuration, updatedProps)
  }

  submitFinalFixesRequest(finalFixRequests) {
    const { submitFinalFixesRequest, milestone } = this.props

    submitFinalFixesRequest(milestone.id, finalFixRequests)
  }

  render() {
    const {
      milestone,
      currentUser,
      previousMilestone,
    } = this.props
    const { isEditing, isMobileEditing } = this.state

    const isPlanned = milestone.status === MILESTONE_STATUS.PLANNED
    const isActive = milestone.status === MILESTONE_STATUS.ACTIVE
    const isCompleted = milestone.status === MILESTONE_STATUS.COMPLETED
    const startDate = !isPlanned && milestone.actualStartDate ? moment.utc(milestone.actualStartDate) : moment.utc(milestone.startDate)
    const month = startDate.format('MMM')
    const date = startDate.format('D')
    const title = milestone.name
    const isUpdating = milestone.isUpdating
    const isActualDateEditable = this.isActualStartDateEditable()
    const isCompletionDateEditable = this.isCompletionDateEditable()
    const editForm = (
      <Form
        fields={[{
          label: 'Name',
          placeholder: 'Name',
          name: 'name',
          value: milestone.name,
          type: 'text',
          validations: {
            isRequired: true
          },
          validationError: 'Name is required',
        }, {
          type: 'number',
          placeholder: 'Duration',
          label: 'Duration',
          name: 'duration',
          value: String(milestone.duration || 0),
          validations: {
            isRequired: true
          },
          validationError: 'Duration is required',
          disabled: isCompleted
        }, {
          label: 'Planned text',
          placeholder: 'Planned text',
          name: 'plannedText',
          value: milestone.plannedText,
          type: 'textarea',
          autoResize: true,
          validations: {
            isRequired: true
          },
          validationError: 'Planned text is required',
        }, {
          label: 'Active text',
          placeholder: 'Active text',
          name: 'activeText',
          value: milestone.activeText,
          type: 'textarea',
          autoResize: true,
          validations: {
            isRequired: true
          },
          validationError: 'Active text is required',
        }, {
          label: 'Blocked text',
          placeholder: 'Blocked text',
          name: 'blockedText',
          value: milestone.blockedText,
          type: 'textarea',
          autoResize: true,
          validations: {
            isRequired: true
          },
          validationError: 'Blocked text is required',
        }, {
          label: 'Completed text',
          placeholder: 'Completed text',
          name: 'completedText',
          value: milestone.completedText,
          type: 'textarea',
          autoResize: true,
          validations: {
            isRequired: true
          },
          validationError: 'Completed text is required',
        }, ...( isActualDateEditable && [{
          label: 'Actual Start date',
          placeholder: 'Actual Start date',
          name: 'actualStartDate',
          value: moment.utc(milestone.actualStartDate).format('YYYY-MM-DD'),
          type: 'date',
          validations: {
            isRequired: true
          },
          validationError: 'Actual Start date is required',
        }]), ...( isCompletionDateEditable && [{
          label: 'Completion date',
          placeholder: 'Completion date',
          name: 'completionDate',
          value: moment.utc(milestone.completionDate).format('YYYY-MM-DD'),
          type: 'date',
          validations: {
            isRequired: true
          },
          validationError: 'Completion date is required',
        }])]}
        onCancelClick={this.closeEditForm}
        onSubmit={this.updateMilestoneWithData}
        onChange={this.milestoneEditorChanged}
        submitButtonTitle="Update milestone"
        title="Milestone Properties"
        disableSubmitButton={this.state.disableSubmit}
      />
    )
    return (
      <div styleName="timeline-post">
        {(<div styleName={'background ' + ((this.state.isHoverHeader && !this.state.isEditing && !isCompleted) ? 'hover ' : '')} />)}
        <div styleName="col-date">
          <div styleName={(isCompleted || isActive ? 'completed' : 'planned')}>
            <div styleName="month">{month}</div>
            <div styleName="day">{date}</div>
          </div>
        </div>
        <div
          styleName={cn('col-timeline-post-con', {
            completed: isCompleted,
            'in-progress': isActive,
            'is-editing': isEditing,
          })}
        >
          <i styleName={'status-ring'} />

          {!isEditing && (
            <dir
              onMouseEnter={this.hoverHeader}
              onMouseLeave={this.unHoverHeader}
              styleName="post-title-container"
            >
              <h4 styleName="post-title">{title}</h4>
              {
                <MediaQuery minWidth={SCREEN_BREAKPOINT_MD}>
                  {(matches) => (matches ? (
                    <div styleName={'desktop-edit-section'}>
                      {hasPermission(PERMISSIONS.MANAGE_PROJECT_PLAN) && this.state.isHoverHeader && !isUpdating &&
                        (<div onClick={this.toggleEditLink} styleName={'post-edit'} >
                          <span styleName="tooltiptext">Edit milestone properties</span>
                        </div>)
                      }
                    </div>
                  ) : (
                    <div styleName={'mobile-edit-section'}>
                      {
                        hasPermission(PERMISSIONS.MANAGE_PROJECT_PLAN) && !isUpdating &&
                          (<div onClick={this.toggleMobileEditLink} styleName={'post-edit-mobile'}  />)
                      }
                    </div>
                  ))
                  }
                </MediaQuery>
              }
            </dir>)
          }

          {isEditing && !isUpdating && (
            <div>
              {editForm}
            </div>
          )}

          {isMobileEditing && !isUpdating && (
            <MobilePage>
              <header styleName="edit-milestone-header">

                <div styleName="header-view">
                  <div styleName="header-view-inner">
                    <div styleName="header-info">
                      <div styleName="title">{milestone.name}</div>
                    </div>
                    <div styleName="header-actions">
                      <button styleName="fullscreen fullscreen-exit" onClick={this.closeEditForm}><XMartIcon /></button>
                    </div>
                  </div>
                </div>
              </header>
              <div styleName="body">
                {editForm}
              </div>
            </MobilePage>
          )}

          {isUpdating && <DotIndicator><LoadingIndicator /></DotIndicator>}

          {!isEditing && !isUpdating && milestone.type === 'phase-specification' && (
            <MilestoneTypePhaseSpecification
              milestone={milestone}
              updateMilestoneContent={this.updateMilestoneContent}
              extendMilestone={this.extendMilestone}
              completeMilestone={this.completeMilestone}
              currentUser={currentUser}
            />
          )}

          {!isEditing && !isUpdating && (milestone.type === 'community-work' || milestone.type === 'community-review' || milestone.type === 'generic-work') && (
            <MilestoneTypeProgress
              milestone={milestone}
              updateMilestoneContent={this.updateMilestoneContent}
              extendMilestone={this.extendMilestone}
              completeMilestone={this.completeMilestone}
              currentUser={currentUser}
            />
          )}

          {!isEditing && !isUpdating && milestone.type === 'checkpoint-review' && (
            <MilestoneTypeCheckpointReview
              milestone={milestone}
              updateMilestoneContent={this.updateMilestoneContent}
              extendMilestone={this.extendMilestone}
              completeMilestone={this.completeMilestone}
              currentUser={currentUser}
            />
          )}

          {!isEditing && !isUpdating && milestone.type === 'add-links' && (
            <MilestoneTypeAddLinks
              milestone={milestone}
              updateMilestoneContent={this.updateMilestoneContent}
              extendMilestone={this.extendMilestone}
              completeMilestone={this.completeMilestone}
              currentUser={currentUser}
            />
          )}

          {!isEditing && !isUpdating && milestone.type === 'final-designs' && (
            <MilestoneTypeFinalDesigns
              milestone={milestone}
              updateMilestoneContent={this.updateMilestoneContent}
              extendMilestone={this.extendMilestone}
              completeMilestone={this.completeMilestone}
              currentUser={currentUser}
            />
          )}

          {!isEditing && !isUpdating && milestone.type === 'final-fix' && (
            <MilestoneTypeFinalFixes
              milestone={milestone}
              updateMilestoneContent={this.updateMilestoneContent}
              extendMilestone={this.extendMilestone}
              completeFinalFixesMilestone={this.completeFinalFixesMilestone}
              submitFinalFixesRequest={this.submitFinalFixesRequest}
              currentUser={currentUser}
            />
          )}

          {
            !isEditing &&
            !isUpdating &&
            (
              milestone.type === 'delivery-dev' ||
              milestone.type === 'delivery-design' ||
              // TODO this is a temporary fallback for already created milestones in DEV backend
              // this is just to keep already created milestones working and can be removed when we don't touch such projects anymore
              milestone.type === 'delivery'
            ) &&
            (
              <MilestoneTypeDelivery
                milestone={milestone}
                updateMilestoneContent={this.updateMilestoneContent}
                extendMilestone={this.extendMilestone}
                completeMilestone={this.completeMilestone}
                submitFinalFixesRequest={this.submitFinalFixesRequest}
                currentUser={currentUser}
                previousMilestone={previousMilestone}
              />
            )
          }
        </div>
      </div>
    )
  }
}

Milestone.propTypes = {
  completeMilestone: PT.func.isRequired,
  currentUser: PT.object.isRequired,
  extendMilestone: PT.func.isRequired,
  milestone: PT.object.isRequired,
  submitFinalFixesRequest: PT.func.isRequired,
  updateMilestone: PT.func.isRequired,
}

export default Milestone

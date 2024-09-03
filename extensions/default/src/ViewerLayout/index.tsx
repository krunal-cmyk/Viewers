import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import { CommandsManager, HangingProtocolService, ServicesManager } from '@ohif/core';
import { ErrorBoundary, LoadingIndicatorProgress, SidePanel } from '@ohif/ui';
import { useAppConfig } from '@state';
import ViewerHeader from './ViewerHeader';

function ViewerLayout({
  // From Extension Module Params
  extensionManager,
  servicesManager,
  hotkeysManager,
  commandsManager,
  // From Modes
  viewports,
  ViewportGridComp,
  leftPanels = [],
  rightPanels = [],
  leftPanelDefaultClosed = false,
  rightPanelDefaultClosed = false,
}): React.FunctionComponent {
  const [appConfig] = useAppConfig();

  const { hangingProtocolService } = servicesManager.services;
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(appConfig.showLoadingIndicator);
  const [isOuterPanelClicked, setIsOuterPanelClicked] = useState(false);
  const [showStudyBrowserModal, setShowStudyModalBrowser] = useState(false);
  /**
   * Set body classes (tailwindcss) that don't allow vertical
   * or horizontal overflow (no scrolling). Also guarantee window
   * is sized to our viewport.
   */
  useEffect(() => {
    document.body.classList.add('bg-black');
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('bg-black');
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const getComponent = id => {
    const entry = extensionManager.getModuleEntry(id);

    if (!entry) {
      throw new Error(
        `${id} is not a valid entry for an extension module, please check your configuration or make sure the extension is registered.`
      );
    }

    let content;
    if (entry && entry.component) {
      content = entry.component;
    } else {
      throw new Error(
        `No component found from extension ${id}. Check the reference string to the extension in your Mode configuration`
      );
    }

    return { entry, content };
  };

  const getPanelData = id => {
    const { content, entry } = getComponent(id);

    return {
      id: entry.id,
      iconName: entry.iconName,
      iconLabel: entry.iconLabel,
      label: entry.label,
      name: entry.name,
      content,
    };
  };

  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      HangingProtocolService.EVENTS.PROTOCOL_CHANGED,

      // Todo: right now to set the loading indicator to false, we need to wait for the
      // hangingProtocolService to finish applying the viewport matching to each viewport,
      // however, this might not be the only approach to set the loading indicator to false. we need to explore this further.
      () => {
        setShowLoadingIndicator(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [hangingProtocolService]);

  const getViewportComponentData = viewportComponent => {
    const { entry } = getComponent(viewportComponent.namespace);

    return {
      component: entry.component,
      displaySetsToDisplay: viewportComponent.displaySetsToDisplay,
    };
  };

  const leftPanelComponents = leftPanels.map(getPanelData);
  const rightPanelComponents = rightPanels.map(getPanelData);
  const viewportComponents = viewports.map(getViewportComponentData);
  const ActiveComponent = leftPanelComponents[0].content;

  return (
    <div>
      <ViewerHeader
        hotkeysManager={hotkeysManager}
        extensionManager={extensionManager}
        servicesManager={servicesManager}
      />
      <div
        className="relative flex w-full flex-row flex-nowrap items-stretch overflow-hidden bg-black"
        style={{ height: 'calc(100vh - 52px' }}
      >
        <React.Fragment>
          {showLoadingIndicator && <LoadingIndicatorProgress className="h-full w-full bg-black" />}
          {/* LEFT SIDEPANELS */}
          {/* {leftPanelComponents.length ? (
            <ErrorBoundary context="Left Panel">
              <SidePanel
                side="left"
                activeTabIndex={rightPanelDefaultClosed ? null : 0}
                tabs={leftPanelComponents}
                servicesManager={servicesManager}
                isOuterPanelClicked={isOuterPanelClicked}
              />
            </ErrorBoundary>
          ) : null} */}
          {/* TOOLBAR + GRID */}
          <div
            onClick={() => {
              console.log('asdfasfasdasds');
              setIsOuterPanelClicked(true);
            }}
            className="flex h-full flex-1 flex-col"
            style={{ marginLeft: 30, marginRight: 30 }}
          >
            <div className="relative flex h-full flex-1 items-center justify-center overflow-hidden bg-black">
              <ErrorBoundary context="Grid">
                <div
                  onClick={() => setShowStudyModalBrowser(true)}
                  style={{
                    position: 'absolute',
                    width: '100px',
                    height: '40px',
                    color: 'white',
                    top: '80px',
                    left: '10px',
                    zIndex: 1,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Series List
                </div>
                <ViewportGridComp
                  servicesManager={servicesManager}
                  viewportComponents={viewportComponents}
                  commandsManager={commandsManager}
                />
              </ErrorBoundary>
            </div>
          </div>
          {rightPanelComponents.length ? (
            <ErrorBoundary context="Right Panel">
              <SidePanel
                side="right"
                activeTabIndex={rightPanelDefaultClosed ? null : 0}
                tabs={rightPanelComponents}
                servicesManager={servicesManager}
                isOuterPanelClicked={isOuterPanelClicked}
              />
            </ErrorBoundary>
          ) : null}
        </React.Fragment>
      </div>
      <div
        // className="flex-static bg-primary-dark flex h-9 cursor-pointer px-[10px]"
        style={{
          position: 'absolute',
          height: 'calc(100vh - 100px)',
          bottom: 0,
          width: '100%',
          padding: 20,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          left: 0,
          backgroundColor: 'rgb(4 28 74)',
          zIndex: 1,
          // overflow: 'scroll',
          display: showStudyBrowserModal ? 'block' : 'none',
        }}
      >
        <div
          style={{
            color: '#041c4a',
            display: 'flex',
            marginBottom: 15,
            width: 30,
            height: 30,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            fontWeight: 'bold',
            alignSelf: 'flex-end',
            backgroundColor: 'white',
            marginLeft: '90%',
            cursor: 'pointer',
          }}
          onClick={() => {
            setShowStudyModalBrowser(false);
          }}
        >
          X
        </div>
        <div
          style={{
            height: 'calc(100vh - 200px)',
            overflow: 'scroll',
            width: '100%',
          }}
        >
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}

ViewerLayout.propTypes = {
  // From extension module params
  extensionManager: PropTypes.shape({
    getModuleEntry: PropTypes.func.isRequired,
  }).isRequired,
  commandsManager: PropTypes.instanceOf(CommandsManager),
  servicesManager: PropTypes.instanceOf(ServicesManager),
  // From modes
  leftPanels: PropTypes.array,
  rightPanels: PropTypes.array,
  leftPanelDefaultClosed: PropTypes.bool.isRequired,
  rightPanelDefaultClosed: PropTypes.bool.isRequired,
  /** Responsible for rendering our grid of viewports; provided by consuming application */
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  viewports: PropTypes.array,
};

export default ViewerLayout;

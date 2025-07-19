'use client';

import { useState, useEffect } from 'react';
import type { PermissionGroup, PermissionTemplate } from '@chat/database';

interface PermissionGroupData {
  groups: PermissionGroup[];
  templates: PermissionTemplate[];
}

export default function PermissionGroupManager() {
  const [data, setData] = useState<PermissionGroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<PermissionGroup | null>(null);
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPermissionGroups();
  }, []);

  const fetchPermissionGroups = async () => {
    try {
      const response = await fetch('/api/admin/permission-groups');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching permission groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = (templateId: string) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedTemplates(newExpanded);
  };

  const getTemplateDetails = (templateId: string) => {
    return data?.templates.find(t => t.id === templateId);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading permission groups...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Failed to load permission groups</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Permission Groups</h2>
        <p className="text-gray-400 mt-1">Manage permission templates and user groups</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Permission Groups */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Permission Groups</h3>
          <div className="space-y-3">
            {data.groups.map((group) => (
              <div
                key={group.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedGroup?.id === group.id
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50'
                }`}
                onClick={() => setSelectedGroup(group)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{group.name}</h4>
                    <p className="text-sm text-gray-400">{group.description}</p>
                  </div>
                  {group.is_default && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      Default
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {group.templates.map((templateId) => {
                    const template = getTemplateDetails(templateId);
                    return (
                      <span
                        key={templateId}
                        className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded"
                      >
                        {template?.name || templateId}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Templates */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Permission Templates</h3>
          <div className="space-y-3">
            {data.templates.map((template) => (
              <div
                key={template.id}
                className="p-4 rounded-lg border border-gray-600 bg-gray-700/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{template.name}</h4>
                    <p className="text-sm text-gray-400">{template.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      template.inheritance === 'base' 
                        ? 'bg-green-500/20 text-green-400'
                        : template.inheritance === 'override'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {template.inheritance}
                    </span>
                    <button
                      onClick={() => toggleTemplate(template.id)}
                      className="text-gray-400 hover:text-white"
                    >
                      {expandedTemplates.has(template.id) ? '−' : '+'}
                    </button>
                  </div>
                </div>
                
                {template.applies_to && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Applies to: </span>
                    <span className="text-xs text-gray-300">
                      {template.applies_to.join(', ')}
                    </span>
                  </div>
                )}

                {expandedTemplates.has(template.id) && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <h5 className="text-sm font-medium text-white mb-2">Permissions:</h5>
                    <div className="grid grid-cols-1 gap-1">
                      {template.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="text-xs text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Group Details */}
      {selectedGroup && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Group Details: {selectedGroup.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-2">Information</h4>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-400">ID:</dt>
                  <dd className="text-gray-300 font-mono">{selectedGroup.id}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Description:</dt>
                  <dd className="text-gray-300">{selectedGroup.description}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">Default Group:</dt>
                  <dd className="text-gray-300">{selectedGroup.is_default ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Included Templates</h4>
              <div className="space-y-2">
                {selectedGroup.templates.map((templateId) => {
                  const template = getTemplateDetails(templateId);
                  return template ? (
                    <div key={templateId} className="text-sm">
                      <div className="text-white font-medium">{template.name}</div>
                      <div className="text-gray-400">{template.description}</div>
                    </div>
                  ) : (
                    <div key={templateId} className="text-sm text-red-400">
                      Template not found: {templateId}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
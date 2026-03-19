import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TabNavigation = ({ activeTab, onTabChange, counts }) => {
 const tabs = [
  {
   id: 'all',
   label: 'All Downloads',
   icon: 'Download',
   count: counts?.all || 0
  },
  {
   id: 'watchLater',
   label: 'Watch Later',
   icon: 'Clock',
   count: counts?.watchLater || 0
  },
  {
   id: 'bookmarks',
   label: 'Bookmarks',
   icon: 'Bookmark',
   count: counts?.bookmarks || 0
  }
 ];

 return (
  <div className="glass-card mb-6">
   <div className="p-1">
    <div className="flex items-center space-x-1">
     {tabs?.map((tab) => (
      <Button
       key={tab?.id}
       variant={activeTab === tab?.id ? 'default' : 'ghost'}
       size="sm"
       onClick={() => onTabChange(tab?.id)}
       className={`flex items-center space-x-2 px-4 py-2 ${
        activeTab === tab?.id 
         ? 'bg-primary text-primary-foreground shadow-glass-sm' 
         : 'text-foreground hover:bg-accent'
       }`}
      >
       <Icon name={tab?.icon} size={16} />
       <span className="font-medium">{tab?.label}</span>
       {tab?.count > 0 && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
         activeTab === tab?.id
          ? 'bg-primary-foreground/20 text-primary-foreground'
          : 'bg-accent text-accent-foreground'
        }`}>
         {tab?.count}
        </span>
       )}
      </Button>
     ))}
    </div>
   </div>
  </div>
 );
};

export default TabNavigation;
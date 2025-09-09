import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Event as EventIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { OpenSeaEvents } from './OpenSeaEvents';

interface NFTEventButtonProps {
  contractAddress: string;
  tokenId: string;
  nftTitle: string;
  eventCount?: number;
}

export const NFTEventButton: React.FC<NFTEventButtonProps> = ({
  contractAddress,
  tokenId,
  nftTitle,
  eventCount = 0
}) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Tooltip title="View OpenSea Events">
        <IconButton
          onClick={handleOpen}
          size="small"
          color="primary"
        >
          <Badge badgeContent={eventCount} color="secondary">
            <EventIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>OpenSea Events - {nftTitle}</span>
            <IconButton
              href={`https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
            >
              <OpenInNewIcon />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          <OpenSeaEvents
            contractAddress={contractAddress}
            tokenId={tokenId}
            nftTitle={nftTitle}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 
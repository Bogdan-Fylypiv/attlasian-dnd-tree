import classes from './messages.module.css';

const Messages = ({ messagesAmount }: { messagesAmount: number }) => {
  return (
    <div className={classes.messages}>
      {messagesAmount >= 1 && (
        <div className={classes.message}>
          <div className={classes.messageHeader}>
            <span className={classes.avatar} />
            <span className={classes.messageTitle}>David</span>
            <span className={classes.messageDate}>20:51</span>
          </div>
          <div className={classes.messageContent}>
            This is the content of the message. It can be a long text that
            describes the message in detail.
          </div>
        </div>
      )}

      {messagesAmount >= 2 && (
        <div className={classes.message}>
          <div className={classes.messageHeader}>
            <span className={classes.avatar} />
            <span className={classes.messageTitle}>John</span>
            <span className={classes.messageDate}>20:52</span>
          </div>
          <div className={classes.messageContent}>
            This is the content of the message. It can be a long text that
            describes the message in detail.
          </div>
        </div>
      )}

      {messagesAmount >= 3 && (
        <div className={classes.message}>
          <div className={classes.messageHeader}>
            <span className={classes.avatar} />
            <span className={classes.messageTitle}>David</span>
            <span className={classes.messageDate}>20:53</span>
          </div>
          <div className={classes.messageContent}>
            This is the content of the message. It can be a long text that
            describes the message in detail.
          </div>
        </div>
      )}

      {messagesAmount >= 4 && (
        <div className={classes.message}>
          <div className={classes.messageHeader}>
            <span className={classes.avatar} />
            <span className={classes.messageTitle}>John</span>
            <span className={classes.messageDate}>20:54</span>
          </div>
          <div className={classes.messageContent}>
            This is the content of the message. It can be a long text that
            describes the message in detail.
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;

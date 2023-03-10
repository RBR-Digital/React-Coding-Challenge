import Head from 'next/head';
import { BiTrashAlt } from 'react-icons/bi';
import {
  Avatar,
  Box,
  Button,
  Heading,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Thead,
  Tr,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Spinner,
  IconButton,
  Th,
  Select,
  useToast,
} from '@chakra-ui/react';
import Template from '@/components/Template';
import { useEffect, useState } from 'react';
import { IMessage } from '@/common/types';
import { listMessages, removeMessage } from '@/fakeApi';

import { createMessage } from '@/fakeApi';
import DangerConfirmation from '@/components/ConfirmationModal';
import MessageModal from '@/components/MessageModal';

export default function Home() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    const getData = async (): Promise<void> => {
      setLoading(true);
      const { data } = await listMessages();

      setMessages(data);
      setLoading(false);
    };
    getData();
  }, []);

  const convertAmPm = (date: string): string => {
    var dt = new Date(date);
    var hours = dt.getHours();
    var AmOrPm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    var minutes = dt.getMinutes();
    var finalTime = hours + ':' + minutes + ' ' + AmOrPm;
    return finalTime;
  };

  const [removingId, setRemovingId] = useState<string>();
  const handleRemoveMessage = async (message: IMessage): Promise<void> => {
    setRemovingId(message._id);
    await removeMessage(message._id);

    setMessages(messages.filter((m) => m._id !== message._id));
    setRemovingId(undefined);

    toast({
      status: 'success',
      title: 'Message removed successfully',
    });
  };

  const renderMessages = () => {
    return (
      <Table>
        <Thead>
          <Tr>
            <Th>User</Th>
            <Th>Subject</Th>
            <Th>Date</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {messages
            .slice(page * maxPerPage, page * maxPerPage + maxPerPage)
            .map((message, index) => (
              <Tr
                key={message._id}
                cursor='pointer'
                _hover={{ bg: 'gray.50' }}
                onClick={() => setSelectedMessage(message)}
              >
                <Td>
                  <HStack spacing='16px'>
                    <Avatar name={message.user.email} />
                    <Text>{message.user.email}</Text>
                  </HStack>
                </Td>
                <Td w='100%' fontWeight={'600'}>
                  {message.subject}
                </Td>
                <Td whiteSpace={'nowrap'}>
                  {message.createdAt.substring(0, 10)} at{' '}
                  {convertAmPm(message.createdAt)}
                </Td>
                <Td>
                  <DangerConfirmation
                    button={
                      <IconButton
                        colorScheme={'red'}
                        aria-label='remove'
                        icon={<BiTrashAlt />}
                        isLoading={removingId === message._id}
                        size='sm'
                      />
                    }
                    action={() => handleRemoveMessage(message)}
                  />
                </Td>
              </Tr>
            ))}
        </Tbody>
      </Table>
    );
  };

  const { isOpen, onClose, onOpen } = useDisclosure();

  const [subject, setSubject] = useState('');
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');

  const [sending, setSending] = useState(false);

  const handleSendMessage = async (): Promise<void> => {
    setSending(true);

    const { data } = await createMessage({
      user: {
        email: recipient,
      },
      message: content,
      subject,
    });

    setMessages([...messages, data]);

    setRecipient('');
    setContent('');
    setSubject('');
    onClose();

    setSending(false);
    toast({
      status: 'success',
      title: 'Message sent successfully',
    });
  };

  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const maxPerPage = 5;

  useEffect(() => {
    if (messages) setPages(Math.ceil(messages.length / maxPerPage));
  }, [messages]);

  useEffect(() => {
    if (pages === 0) return;

    if (pages - 1 < page) {
      setPage(pages - 1);
    }
  }, [pages]);

  const [selectedMessage, setSelectedMessage] = useState<IMessage>();
  const [messageIsOpen, setMessageIsOpen] = useState(false);

  useEffect(() => {
    if (selectedMessage) {
      setMessageIsOpen(true);
      return;
    }

    setMessageIsOpen(false);
  }, [selectedMessage]);

  return (
    <>
      <Head>
        <title>RBR Test</title>
      </Head>
      <Template>
        <MessageModal
          isOpen={messageIsOpen}
          onClose={() => setSelectedMessage(undefined)}
          message={selectedMessage}
          remove={handleRemoveMessage}
        />
        <HStack justifyContent={'space-between'} mb='24px'>
          <Heading as='h2' fontSize='24px'>
            Messages
          </Heading>
          <Box>
            <Button onClick={onOpen} colorScheme='blue'>
              New Message
            </Button>

            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay />
              <ModalContent maxW={'800px'}>
                <ModalHeader>New message</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <FormControl mb='24px'>
                    <FormLabel>Subject</FormLabel>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Recipient</FormLabel>
                    <Input
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder='someone@mail.com'
                    />
                  </FormControl>
                  <FormControl mt='24px'>
                    <FormLabel>My message</FormLabel>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </FormControl>
                </ModalBody>

                <ModalFooter>
                  <Button variant='ghost' mr={3} onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    isDisabled={!subject || !recipient || !content}
                    colorScheme='blue'
                    isLoading={sending}
                  >
                    Send message
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </Box>
        </HStack>
        {loading ? <Spinner /> : renderMessages()}

        {!loading && (
          <HStack justifyContent={'flex-end'} mt='24px'>
            <Text>Page</Text>
            <Select
              w='90px'
              value={page}
              onChange={(e) => setPage(parseInt(e.target.value))}
            >
              {Array.from({
                length: pages,
              }).map((_el, index) => (
                <option key={index} value={index}>
                  {index + 1}
                </option>
              ))}
            </Select>
          </HStack>
        )}
      </Template>
    </>
  );
}

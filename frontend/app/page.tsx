'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  Divider,
  Badge,
  Icon,
  Flex,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Image,
} from '@chakra-ui/react'
import { FaYinYang, FaUser, FaBaby, FaBuilding, FaMagic, FaHistory, FaSignInAlt, FaUserPlus } from 'react-icons/fa'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/names'

interface GeneratedName {
  name: string
  pinyin: string
  wuxing: string
  meaning: string
  score: number
}

interface BaZiChart {
  year: { stem: string; branch: string; element: string }
  month: { stem: string; branch: string; element: string }
  day: { stem: string; branch: string; element: string }
  hour: { stem: string; branch: string; element: string }
}

export default function Home() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [names, setNames] = useState<GeneratedName[]>([])
  const [baziChart, setBaziChart] = useState<BaZiChart | null>(null)
  const [wuxing, setWuxing] = useState<any>(null)
  const [remaining, setRemaining] = useState<number>(-1)
  
  // User state
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string>('')
  const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useDisclosure()
  const { isOpen: isPayOpen, onOpen: onPayOpen, onClose: onPayClose } = useDisclosure()
  
  const [formData, setFormData] = useState({
    nameType: 'baby',
    gender: '',
    birthDate: '',
    birthTime: '',
    surname: '',
    description: '',
    style: 'classical',
  })
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })
  
  const toast = useToast()
  
  // Check for saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('yiname_token')
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])
  
  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleLoginChange = (e: any) => {
    const { name, value } = e.target
    setLoginForm(prev => ({ ...prev, [name]: value }))
  }
  
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      toast({ title: '请填写完整信息', status: 'warning' })
      return
    }
    
    try {
      // Simple login - in production use Supabase Auth
      const loginToken = btoa(loginForm.email + ':' + loginForm.password)
      setToken(loginToken)
      localStorage.setItem('yiname_token', loginToken)
      setUser({ email: loginForm.email })
      onLoginClose()
      toast({ title: '登录成功！', status: 'success' })
    } catch (e) {
      toast({ title: '登录失败', status: 'error' })
    }
  }
  
  const handleLogout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('yiname_token')
    toast({ title: '已退出登录', status: 'info' })
  }
  
  const handleGuestTry = () => {
    // Guest can try once without login
    setUser({ email: 'guest', isGuest: true })
  }
  
  const handleSubmit = async () => {
    if (!formData.birthDate) {
      toast({ title: '请选择出生日期', status: 'warning', duration: 3000 })
      return
    }
    
    // Check if user needs to login
    if (!user && !token) {
      onLoginOpen()
      toast({ title: '请先登录或体验', status: 'info', duration: 3000 })
      return
    }
    
    setLoading(true)
    try {
      let birthHour: number | undefined
      const timeMap: { [key: string]: number } = {
        '子': 0, '丑': 2, '寅': 4, '卯': 6,
        '辰': 8, '巳': 10, '午': 12, '未': 14,
        '申': 16, '酉': 18, '戌': 20, '亥': 22
      }
      if (formData.birthTime) {
        birthHour = timeMap[formData.birthTime]
      }
      
      const config: any = {
        method: 'POST',
        url: API_URL,
        data: {
          name_type: formData.nameType,
          gender: formData.gender || null,
          birth_date: formData.birthDate,
          birth_time: formData.birthTime || null,
          birth_hour: birthHour,
          surname: formData.surname,
          description: formData.description,
          style: formData.style,
          count: 10,
        }
      }
      
      if (token) {
        config.headers = { 'Authorization': `Bearer ${token}` }
      }
      
      const response = await axios(config)
      
      if (response.data.error === 'NO_QUOTA') {
        onPayOpen()
        toast({ title: '次数已用完', description: '请充值后继续使用', status: 'warning', duration: 5000 })
        return
      }
      
      setNames(response.data.names)
      setBaziChart(response.data.bazi_chart)
      setWuxing(response.data.wuxing_analysis)
      setRemaining(response.data.remaining)
      setStep(2)
      
      toast({ title: '名字生成成功！', status: 'success', duration: 3000 })
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || '请稍后重试'
      toast({
        title: '生成失败',
        description: msg,
        status: 'error',
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="brand.600" color="white" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Icon as={FaYinYang} boxSize={6} />
              <Heading size="md">易名云 YiName</Heading>
            </HStack>
            <HStack spacing={3}>
              {user ? (
                <>
                  <Badge colorScheme="green" fontSize="sm">
                    {remaining >= 0 ? `剩余${remaining}次` : '体验中'}
                  </Badge>
                  <Text fontSize="sm">{user.email}</Text>
                  <Button size="sm" variant="ghost" color="white" onClick={handleLogout}>
                    退出
                  </Button>
                </>
              ) : (
                <Button size="sm" color="white" leftIcon={<FaSignInAlt />} onClick={onLoginOpen}>
                  登录
                </Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>
      
      <Container maxW="container.md" py={8}>
        {step === 1 ? (
          <Card>
            <CardHeader>
              <Heading size="md">开始取名</Heading>
              <Text color="gray.600" mt={1}>
                输入您的信息，让我们为您生成合适的名字
              </Text>
            </CardHeader>
            <CardBody>
              <VStack spacing={5} align="stretch">
                {/* Name Type */}
                <FormControl>
                  <FormLabel>取名类型</FormLabel>
                  <HStack spacing={3}>
                    <Button flex={1} colorScheme={formData.nameType === 'baby' ? 'brand' : 'gray'} onClick={() => setFormData(p => ({ ...p, nameType: 'baby' }))}>
                      宝宝取名
                    </Button>
                    <Button flex={1} colorScheme={formData.nameType === 'personal' ? 'brand' : 'gray'} onClick={() => setFormData(p => ({ ...p, nameType: 'personal' }))}>
                      个人取名
                    </Button>
                    <Button flex={1} colorScheme={formData.nameType === 'business' ? 'brand' : 'gray'} onClick={() => setFormData(p => ({ ...p, nameType: 'business' }))}>
                      企业取名
                    </Button>
                  </HStack>
                </FormControl>
                
                {/* Gender */}
                <FormControl>
                  <FormLabel>性别</FormLabel>
                  <Select name="gender" value={formData.gender} onChange={handleInputChange} placeholder="选择性别">
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </Select>
                </FormControl>
                
                {/* Birth Date */}
                <FormControl isRequired>
                  <FormLabel>出生日期</FormLabel>
                  <Input type="datetime-local" name="birthDate" value={formData.birthDate} onChange={handleInputChange} />
                </FormControl>
                
                {/* Birth Time */}
                <FormControl>
                  <FormLabel>出生时辰</FormLabel>
                  <Select name="birthTime" value={formData.birthTime} onChange={handleInputChange} placeholder="选择时辰（可选）">
                    <option value="子">子时 (23:00-01:00)</option>
                    <option value="丑">丑时 (01:00-03:00)</option>
                    <option value="寅">寅时 (03:00-05:00)</option>
                    <option value="卯">卯时 (05:00-07:00)</option>
                    <option value="辰">辰时 (07:00-09:00)</option>
                    <option value="巳">巳时 (09:00-11:00)</option>
                    <option value="午">午时 (11:00-13:00)</option>
                    <option value="未">未时 (13:00-15:00)</option>
                    <option value="申">申时 (15:00-17:00)</option>
                    <option value="酉">酉时 (17:00-19:00)</option>
                    <option value="戌">戌时 (19:00-21:00)</option>
                    <option value="亥">亥时 (21:00-23:00)</option>
                  </Select>
                </FormControl>
                
                {/* Surname */}
                <FormControl>
                  <FormLabel>姓氏</FormLabel>
                  <Input name="surname" value={formData.surname} onChange={handleInputChange} placeholder="请输入姓氏（可选）" maxLength={2} />
                </FormControl>
                
                {/* Style */}
                <FormControl>
                  <FormLabel>名字风格</FormLabel>
                  <Select name="style" value={formData.style} onChange={handleInputChange}>
                    <option value="classical">古典风</option>
                    <option value="modern">现代风</option>
                    <option value="creative">创意风</option>
                  </Select>
                </FormControl>
                
                {/* Description */}
                <FormControl>
                  <FormLabel>其他要求</FormLabel>
                  <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="请描述您对名字的其他要求（可选）" rows={2} />
                </FormControl>
                
                <Button colorScheme="brand" size="lg" leftIcon={loading ? <Spinner size="sm" /> : <FaMagic />} onClick={handleSubmit} isLoading={loading} loadingText="生成中...">
                  生成名字
                </Button>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          <VStack spacing={5} align="stretch">
            {/* BaZi Chart */}
            {baziChart && (
              <Card>
                <CardHeader><Heading size="sm">八字排盘</Heading></CardHeader>
                <CardBody pt={0}>
                  <SimpleGrid columns={4} spacing={4} textAlign="center">
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">{baziChart.year.stem}{baziChart.year.branch}</Text>
                      <Badge>年柱</Badge>
                    </Box>
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">{baziChart.month.stem}{baziChart.month.branch}</Text>
                      <Badge>月柱</Badge>
                    </Box>
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">{baziChart.day.stem}{baziChart.day.branch}</Text>
                      <Badge colorScheme="red">日柱</Badge>
                    </Box>
                    <Box>
                      <Text fontSize="xl" fontWeight="bold">{baziChart.hour.stem}{baziChart.hour.branch}</Text>
                      <Badge>时柱</Badge>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>
            )}
            
            {/* Names */}
            <Card>
              <CardHeader><Heading size="md">为您推荐的名字</Heading></CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3} align="stretch">
                  {names.map((name, index) => (
                    <Box key={index} p={4} borderWidth={1} borderRadius="md">
                      <Flex justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Heading size="md">{name.name}</Heading>
                            <Badge colorScheme="blue">{name.pinyin}</Badge>
                            <Badge colorScheme="green">{name.wuxing}</Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">{name.meaning}</Text>
                        </VStack>
                        <VStack>
                          <Text fontSize="2xl" fontWeight="bold" color="brand.500">{name.score}</Text>
                          <Text fontSize="xs" color="gray.500">评分</Text>
                        </VStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
            
            <Button variant="outline" onClick={() => setStep(1)}>重新输入</Button>
          </VStack>
        )}
      </Container>
      
      {/* Login Modal */}
      <Modal isOpen={isLoginOpen} onClose={onLoginClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>登录 / 注册</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>邮箱</FormLabel>
                <Input name="email" type="email" value={loginForm.email} onChange={handleLoginChange} placeholder="请输入邮箱" />
              </FormControl>
              <FormControl>
                <FormLabel>密码</FormLabel>
                <Input name="password" type="password" value={loginForm.password} onChange={handleLoginChange} placeholder="请输入密码" />
              </FormControl>
              <Button colorScheme="brand" w="full" onClick={handleLogin}>登录</Button>
              <Divider />
              <Button variant="outline" w="full" onClick={() => { onLoginClose(); handleGuestTry(); }}>
                游客体验（1次）
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Payment Modal */}
      <Modal isOpen={isPayOpen} onClose={onPayClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>充值续费</ModalHeader>
          <ModalBody>
            <VStack spacing={4} textAlign="center">
              <Text fontSize="lg">每次生成名字仅需</Text>
              <Heading size="2xl" color="brand.500">¥9.9</Heading>
              <Text fontSize="sm" color="gray.500">一次付费，终身使用</Text>
              
              <Divider />
              
              <Text fontWeight="bold">请添加微信支付</Text>
              <Box p={4} bg="gray.100" borderRadius="md">
                <Text>请添加客服微信：</Text>
                <Text fontSize="2xl" fontWeight="bold" color="brand.600">yiname-app</Text>
              </Box>
              <Text fontSize="sm" color="gray.500">转账时请备注您的邮箱，转账后自动开通</Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={onPayClose}>关闭</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}
